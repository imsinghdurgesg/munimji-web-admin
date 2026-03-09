import { useState, useEffect, type FormEvent } from 'react';
import { Upload, X, RefreshCw, Camera } from 'lucide-react';
import { useProductStore } from '../store/productStore';
import { productApi } from '../services/api';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { Select } from './Select';
import { generateSKU } from '../utils/sku-generator';
import type { Product } from '../types';

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const { categories, fetchCategories, createProduct, updateProduct } = useProductStore();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.imageUrl || null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isManualSKU, setIsManualSKU] = useState(!!product?.sku);

  const [formData, setFormData] = useState({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    categoryId: product?.categoryId || '',
    hsnCode: product?.hsnCode || '',
    taxRate: product?.taxRate || 18,
    costPrice: product?.costPrice || 0,
    sellingPrice: product?.sellingPrice || 0,
    mrp: product?.mrp || 0,
    currentStock: product?.currentStock || 0,
    minStockLevel: product?.minStockLevel || 10,
    catalogVisible: product?.catalogVisible ?? true,
    catalogOrder: product?.catalogOrder || 0,
  });

  // Auto-generate SKU when name changes (only if not manual)
  useEffect(() => {
    if (!isManualSKU && formData.name && !product) {
      const generatedSKU = generateSKU(formData.name);
      setFormData(prev => ({ ...prev, sku: generatedSKU }));
    }
  }, [formData.name, isManualSKU, product]);

  useEffect(() => {
    if (categories.length === 0) {
      fetchCategories();
    }
  }, [categories.length, fetchCategories]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let imageUrl = product?.imageUrl;
      let images = product?.images;

      // Upload image if new file selected
      if (imageFile) {
        setIsUploadingImage(true);
        try {
          const response = await productApi.uploadImage(imageFile);
          // Use medium size as the primary imageUrl
          imageUrl = response.images.medium;
          // Store all sizes in the images field
          images = response.images;
        } catch (error) {
          console.error('Image upload failed:', error);
          alert('Failed to upload image. Proceeding without image.');
        }
        setIsUploadingImage(false);
      }

      const productData = {
        ...formData,
        categoryId: formData.categoryId ? Number(formData.categoryId) : undefined,
        taxRate: formData.taxRate ? Number(formData.taxRate) : undefined,
        costPrice: Number(formData.costPrice),
        sellingPrice: Number(formData.sellingPrice),
        mrp: formData.mrp ? Number(formData.mrp) : undefined,
        currentStock: Number(formData.currentStock),
        minStockLevel: Number(formData.minStockLevel),
        catalogOrder: formData.catalogOrder ? Number(formData.catalogOrder) : undefined,
        imageUrl,
        images,
      };

      if (product) {
        await updateProduct(product.id, productData);
      } else {
        await createProduct(productData);
      }

      onSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save product';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
        {imagePreview ? (
          <div className="relative inline-block">
            <img
              src={imagePreview}
              alt="Preview"
              className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
            />
            <button
              type="button"
              onClick={removeImage}
              className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {/* Take Photo (Camera) */}
            <label className="flex flex-col items-center justify-center h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex flex-col items-center justify-center">
                <Camera className="w-8 h-8 text-blue-500 mb-2" />
                <p className="text-sm text-gray-700 font-medium">Take Photo</p>
                <p className="text-xs text-gray-400">Use camera</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
              />
            </label>

            {/* Upload from Files */}
            <label className="flex flex-col items-center justify-center h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex flex-col items-center justify-center">
                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-700 font-medium">Upload Image</p>
                <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            SKU {!product && <span className="text-xs text-gray-500">(Auto-generated)</span>}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={formData.sku}
              onChange={(e) => {
                setFormData({ ...formData, sku: e.target.value });
                setIsManualSKU(true);
              }}
              onFocus={() => setIsManualSKU(true)}
              required
              disabled={isLoading}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="e.g., PROD-20260308-A1B2"
            />
            {!product && (
              <button
                type="button"
                onClick={() => {
                  const newSKU = generateSKU(formData.name);
                  setFormData({ ...formData, sku: newSKU });
                  setIsManualSKU(false);
                }}
                disabled={isLoading}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                title="Regenerate SKU"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {!product ? 'Auto-generated from product name. Click refresh to regenerate or edit manually.' : 'Cannot change SKU after product creation'}
          </p>
        </div>

        <Input
          label="Product Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          disabled={isLoading}
        />
      </div>

      <Textarea
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        rows={3}
        disabled={isLoading}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Category"
          value={formData.categoryId}
          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          options={[
            { value: '', label: 'Select Category' },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
          disabled={isLoading}
        />

        <Input
          label="HSN Code"
          value={formData.hsnCode}
          onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Cost Price"
          type="number"
          step="0.01"
          value={formData.costPrice}
          onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
          required
          disabled={isLoading}
        />

        <Input
          label="Selling Price"
          type="number"
          step="0.01"
          value={formData.sellingPrice}
          onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) })}
          required
          disabled={isLoading}
        />

        <Input
          label="MRP"
          type="number"
          step="0.01"
          value={formData.mrp}
          onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Input
          label="Current Stock"
          type="number"
          value={formData.currentStock}
          onChange={(e) => setFormData({ ...formData, currentStock: Number(e.target.value) })}
          required
          disabled={isLoading}
        />

        <Input
          label="Min Stock Level"
          type="number"
          value={formData.minStockLevel}
          onChange={(e) => setFormData({ ...formData, minStockLevel: Number(e.target.value) })}
          required
          disabled={isLoading}
        />

        <Input
          label="Tax Rate (%)"
          type="number"
          step="0.01"
          value={formData.taxRate}
          onChange={(e) => setFormData({ ...formData, taxRate: Number(e.target.value) })}
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="catalogVisible"
          checked={formData.catalogVisible}
          onChange={(e) => setFormData({ ...formData, catalogVisible: e.target.checked })}
          className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          disabled={isLoading}
        />
        <label htmlFor="catalogVisible" className="text-sm font-medium text-gray-700">
          Visible in Web Catalog
        </label>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          className="flex-1"
          isLoading={isLoading || isUploadingImage}
        >
          {isUploadingImage
            ? 'Uploading Image...'
            : isLoading
              ? 'Saving...'
              : product
                ? 'Update Product'
                : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}
