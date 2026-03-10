import { useState, type FormEvent } from 'react';
import { useProductStore } from '../store/productStore';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import type { Category } from '../types';

interface CategoryFormProps {
  category?: Category | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CategoryForm({ category, onSuccess, onCancel }: CategoryFormProps) {
  const { createCategory, updateCategory } = useProductStore();
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: category?.name || '',
    description: category?.description || '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (category) {
        // Update existing category
        await updateCategory(category.id, formData);
      } else {
        // Create new category
        await createCategory(formData);
      }
      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save category';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Category Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        required
        disabled={isLoading}
        placeholder="e.g., Electronics, Clothing, Food"
      />

      <Textarea
        label="Description (Optional)"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        rows={3}
        disabled={isLoading}
        placeholder="Brief description of this category"
      />

      <div className="flex gap-3 pt-4 border-t" style={{ borderColor: '#e5e7eb' }}>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" className="flex-1" isLoading={isLoading}>
          {isLoading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}
