import { useEffect, useState } from 'react';
import { FolderTree, Plus, Edit, Trash2 } from 'lucide-react';
import { useProductStore } from '../store/productStore';
import { Button } from './Button';
import { Modal } from './Modal';
import { CategoryForm } from './CategoryForm';
import type { Category } from '../types';

interface CategoryListProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CategoryList({ isOpen, onClose }: CategoryListProps) {
  const { categories, fetchCategories } = useProductStore();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, fetchCategories]);

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = async (_id: number) => {
    if (confirm('Are you sure you want to delete this category? Products in this category will not be deleted.')) {
      // TODO: Implement delete
      alert('Delete functionality coming soon!');
    }
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
    fetchCategories();
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingCategory(null);
  };

  return (
    <>
      <Modal isOpen={isOpen && !isFormOpen} onClose={onClose} title="Manage Categories" size="lg">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex justify-between items-center">
            <p style={{ color: '#6b7280' }}>
              Create and manage product categories for better organization
            </p>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsFormOpen(true)}
            >
              Add Category
            </Button>
          </div>

          {/* Categories List */}
          {categories.length === 0 ? (
            <div className="text-center py-12" style={{ backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
              <FolderTree className="w-12 h-12 mx-auto mb-4" style={{ color: '#9ca3af' }} />
              <p style={{ color: '#6b7280' }}>No categories yet</p>
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                onClick={() => setIsFormOpen(true)}
              >
                Create Your First Category
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                  style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
                >
                  <div>
                    <h3 className="font-medium" style={{ color: '#111827' }}>{category.name}</h3>
                    {category.description && (
                      <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-2 rounded hover:bg-gray-100"
                      style={{ color: '#2563eb' }}
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 rounded hover:bg-gray-100"
                      style={{ color: '#dc2626' }}
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Category Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={handleFormClose}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        size="md"
      >
        <CategoryForm
          category={editingCategory}
          onSuccess={handleFormSuccess}
          onCancel={handleFormClose}
        />
      </Modal>
    </>
  );
}
