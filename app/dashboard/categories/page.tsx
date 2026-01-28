// app/dashboard/categories/page.tsx

'use client'

import { useState } from 'react'
import useSWR from 'swr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Trash2, ChevronRight, Folder, FolderOpen, Loader2 } from 'lucide-react'

interface Category {
    id: string
    parent_id: string | null
    name: string
    description: string | null
    icon: string | null
    sort_order: number
    is_active: boolean
    children?: Category[]
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function CategoriesPage() {
    const { data, isLoading: isLoadingData, mutate } = useSWR<{ categories: Category[] }>(
        '/api/categories',
        fetcher,
        {
            revalidateOnFocus: false,
            dedupingInterval: 30000, // 30 секунд кэш
        }
    )
    const categories = data?.categories || []

    const [isSaving, setIsSaving] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingCategory, setEditingCategory] = useState<Category | null>(null)
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState({
        parent_id: '',
        name: '',
        description: '',
        icon: '',
        sort_order: 0,
        is_active: true,
    })

    const resetForm = () => {
        setFormData({
            parent_id: '',
            name: '',
            description: '',
            icon: '',
            sort_order: 0,
            is_active: true,
        })
        setEditingCategory(null)
        setError(null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSaving(true)
        setError(null)

        try {
            const url = editingCategory
                ? `/api/categories/${editingCategory.id}`
                : '/api/categories'

            const response = await fetch(url, {
                method: editingCategory ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    parent_id: formData.parent_id || null,
                }),
            })

            if (!response.ok) {
                const result = await response.json()
                setError(result.error || 'Fehler beim Speichern')
                return
            }

            resetForm()
            setShowForm(false)
            mutate()
        } catch (err) {
            setError('Ein Fehler ist aufgetreten')
        } finally {
            setIsSaving(false)
        }
    }

    const handleEdit = (category: Category) => {
        setFormData({
            parent_id: category.parent_id || '',
            name: category.name,
            description: category.description || '',
            icon: category.icon || '',
            sort_order: category.sort_order,
            is_active: category.is_active,
        })
        setEditingCategory(category)
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Kategorie wirklich löschen?')) return

        try {
            const response = await fetch(`/api/categories/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                mutate()
            }
        } catch (err) {
            console.error('Delete error:', err)
        }
    }

    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) {
                next.delete(id)
            } else {
                next.add(id)
            }
            return next
        })
    }

    const handleAddSubcategory = (parentId: string) => {
        resetForm()
        setFormData(prev => ({ ...prev, parent_id: parentId }))
        setShowForm(true)
    }

    // Получаем все root категории для выбора parent
    // Исключаем текущую редактируемую категорию, чтобы предотвратить self-reference
    const rootCategories = categories.filter(c =>
        !c.parent_id && (!editingCategory || c.id !== editingCategory.id)
    )

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Kategorien</h1>
                    <p className="text-gray-500 mt-1">Organisieren Sie Ihre Dienstleistungen</p>
                </div>
                <Button onClick={() => { resetForm(); setShowForm(!showForm) }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Neue Kategorie
                </Button>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">
                        {editingCategory ? 'Kategorie bearbeiten' : 'Neue Kategorie'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    placeholder="z.B. Haare"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="parent_id">Übergeordnete Kategorie</Label>
                                <select
                                    id="parent_id"
                                    value={formData.parent_id}
                                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                >
                                    <option value="">— Hauptkategorie —</option>
                                    {rootCategories.map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Beschreibung</Label>
                            <Input
                                id="description"
                                placeholder="Optionale Beschreibung"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="icon">Icon</Label>
                                <select
                                    id="icon"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                                >
                                    <option value="">Kein Icon</option>
                                    <option value="scissors">✂️ Schere (Haare)</option>
                                    <option value="eye">👁️ Auge (Augenbrauen)</option>
                                    <option value="hand">💅 Hand (Nägel)</option>
                                    <option value="sparkles">✨ Sterne (Beauty)</option>
                                    <option value="heart">❤️ Herz (Wellness)</option>
                                    <option value="sun">☀️ Sonne (Solarium)</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="sort_order">Sortierung</Label>
                                <Input
                                    id="sort_order"
                                    type="number"
                                    value={formData.sort_order}
                                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="h-4 w-4 rounded border-gray-300"
                            />
                            <Label htmlFor="is_active" className="font-normal">Aktiv</Label>
                        </div>

                        <div className="flex gap-4 pt-2">
                            <Button type="submit" disabled={isSaving}>
                                {isSaving ? 'Wird gespeichert...' : 'Speichern'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm() }}>
                                Abbrechen
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Categories List */}
            <div className="bg-white rounded-lg shadow">
                {isLoadingData ? (
                    <div className="px-6 py-12 text-center text-gray-500">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        Kategorien werden geladen...
                    </div>
                ) : categories.length > 0 ? (
                    <ul className="divide-y divide-gray-200">
                        {categories.map((category) => (
                            <li key={category.id}>
                                {/* Parent Category */}
                                <div className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        {category.children && category.children.length > 0 ? (
                                            <button onClick={() => toggleExpand(category.id)} className="p-1">
                                                <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${expandedIds.has(category.id) ? 'rotate-90' : ''
                                                    }`} />
                                            </button>
                                        ) : (
                                            <span className="w-6" />
                                        )}
                                        {expandedIds.has(category.id) ? (
                                            <FolderOpen className="h-5 w-5 text-blue-500" />
                                        ) : (
                                            <Folder className="h-5 w-5 text-gray-400" />
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900">{category.name}</p>
                                            {category.description && (
                                                <p className="text-sm text-gray-500">{category.description}</p>
                                            )}
                                        </div>
                                        {!category.is_active && (
                                            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Inaktiv</span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleAddSubcategory(category.id)}
                                            title="Unterkategorie hinzufügen"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(category)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-600 hover:text-red-700"
                                            onClick={() => handleDelete(category.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Children */}
                                {expandedIds.has(category.id) && category.children && category.children.length > 0 && (
                                    <ul className="bg-gray-50 border-t">
                                        {category.children.map((child) => (
                                            <li key={child.id} className="px-6 py-3 pl-16 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Folder className="h-4 w-4 text-gray-400" />
                                                    <p className="text-gray-700">{child.name}</p>
                                                    {!child.is_active && (
                                                        <span className="text-xs bg-gray-200 text-gray-500 px-2 py-1 rounded">Inaktiv</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(child)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:text-red-700"
                                                        onClick={() => handleDelete(child.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="px-6 py-12 text-center text-gray-500">
                        Noch keine Kategorien vorhanden
                    </div>
                )}
            </div>
        </div>
    )
}