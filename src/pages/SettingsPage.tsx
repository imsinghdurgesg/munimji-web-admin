import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { shopApi } from '../services/api';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const { shop, refreshShop } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: shop?.name || '',
    catalogSlug: shop?.catalogSlug || '',
    whatsappNumber: shop?.whatsappNumber || '',
    catalogEnabled: shop?.catalogEnabled ?? false,
  });

  // Fetch shop data on component mount
  useEffect(() => {
    refreshShop();
  }, [refreshShop]);

  // Update form data when shop data loads
  useEffect(() => {
    if (shop) {
      setFormData({
        name: shop.name || '',
        catalogSlug: shop.catalogSlug || '',
        whatsappNumber: shop.whatsappNumber || '',
        catalogEnabled: shop.catalogEnabled ?? false,
      });
    }
  }, [shop]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shop?.id) {
      alert('Shop information not found. Please login again.');
      return;
    }

    setIsLoading(true);

    try {
      // Update shop name if changed
      if (formData.name !== shop.name) {
        await shopApi.update(shop.id, {
          name: formData.name,
        });
      }

      // Update catalog settings if changed
      if (
        formData.catalogEnabled !== shop.catalogEnabled ||
        formData.catalogSlug !== shop.catalogSlug ||
        formData.whatsappNumber !== shop.whatsappNumber
      ) {
        await shopApi.updateCatalogSettings(shop.id, {
          catalogEnabled: formData.catalogEnabled,
          catalogSlug: formData.catalogSlug,
          whatsappNumber: formData.whatsappNumber,
        });
      }

      // Refresh shop data in store
      await refreshShop();

      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your shop and catalog settings</p>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Shop Information</h3>
            <div className="space-y-4">
              <Input
                label="Shop Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isLoading}
              />

              <Input
                label="Catalog Slug"
                value={formData.catalogSlug}
                onChange={(e) => setFormData({ ...formData, catalogSlug: e.target.value })}
                helperText={`Your catalog will be available at: https://munimji.store/${formData.catalogSlug}`}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Catalog Settings */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Catalog Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="catalogEnabled"
                  checked={formData.catalogEnabled}
                  onChange={(e) => setFormData({ ...formData, catalogEnabled: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  disabled={isLoading}
                />
                <label htmlFor="catalogEnabled" className="text-sm font-medium text-gray-700">
                  Enable Web Catalog
                </label>
              </div>

              <Input
                label="WhatsApp Number"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                placeholder="919999999999"
                helperText="Enter number with country code (without +)"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-6 border-t">
            <Button
              type="submit"
              variant="primary"
              leftIcon={<Save className="w-5 h-5" />}
              isLoading={isLoading}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>

      {/* Catalog URL Info */}
      {shop?.catalogEnabled && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-2">Your Catalog URL</h3>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white px-4 py-2 rounded border border-primary-200 text-primary-900">
              https://munimji.store/{shop.catalogSlug}
            </code>
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.open(`https://munimji.store/${shop.catalogSlug}`, '_blank')}
            >
              View
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
