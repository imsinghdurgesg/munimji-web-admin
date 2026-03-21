import { Camera, Save, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { shopApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { getImageUrl } from '../utils/image';

export default function SettingsPage() {
  const { shop, refreshShop } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    getImageUrl(shop?.catalogTheme?.logo) || null
  );
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [formData, setFormData] = useState({
    name: shop?.name || '',
    catalogSlug: shop?.catalogSlug || '',
    whatsappNumber: shop?.whatsappNumber || '',
    catalogEnabled: shop?.catalogEnabled ?? false,
  });

  // Update form data when shop data loads
  useEffect(() => {
    if (shop) {
      setFormData({
        name: shop.name || '',
        catalogSlug: shop.catalogSlug || '',
        whatsappNumber: shop.whatsappNumber || '',
        catalogEnabled: shop.catalogEnabled ?? false,
      });
      setLogoPreview(getImageUrl(shop.catalogTheme?.logo) || null);
    }
  }, [shop]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(getImageUrl(shop?.catalogTheme?.logo) || null);
  };

  const handleDeleteLogo = async () => {
    if (!confirm('Are you sure you want to delete the logo?')) {
      return;
    }

    setIsLoading(true);

    try {
      await shopApi.deleteLogo();
      setLogoPreview(null);
      setLogoFile(null);
      await refreshShop();
      alert('Logo deleted successfully!');
    } catch (error) {
      console.error('Failed to delete logo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete logo';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!shop?.id) {
      alert('Shop information not found. Please login again.');
      return;
    }

    setIsLoading(true);

    try {
      // Upload logo if new file selected
      if (logoFile) {
        setIsUploadingLogo(true);
        try {
          await shopApi.uploadLogo(logoFile);
          setLogoFile(null);
        } catch (error) {
          console.error('Logo upload failed:', error);
          alert('Failed to upload logo. Proceeding with other settings.');
        }
        setIsUploadingLogo(false);
      }

      // Update shop name if changed
      if (formData.name !== shop.name) {
        console.log('Updating shop name:', formData.name);
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
        console.log('Updating catalog settings:', {
          catalogEnabled: formData.catalogEnabled,
          catalogSlug: formData.catalogSlug,
          whatsappNumber: formData.whatsappNumber,
        });
        await shopApi.updateCatalogSettings(shop.id, {
          catalogEnabled: formData.catalogEnabled,
          catalogSlug: formData.catalogSlug,
          whatsappNumber: formData.whatsappNumber,
        });
      }

      // Refresh shop data in store
      console.log('Refreshing shop data...');
      await refreshShop();
      console.log('Shop data refreshed');

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
          {/* Shop Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Shop Logo</label>
            <p className="text-sm text-gray-500 mb-3">
              This logo will be shown when sharing your catalog on WhatsApp and social media
            </p>
            {logoPreview ? (
              <div className="space-y-3">
                <div className="relative inline-block">
                  <img
                    src={logoPreview}
                    alt="Shop Logo"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
                  />
                  {logoFile && (
                    <button
                      type="button"
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="flex gap-2">
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors text-sm font-medium">
                    <Camera className="w-4 h-4" />
                    Take New Photo
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      capture="environment"
                      onChange={handleLogoChange}
                    />
                  </label>
                  <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors text-sm font-medium">
                    <Upload className="w-4 h-4" />
                    Upload New
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleLogoChange}
                    />
                  </label>
                  {shop?.catalogTheme?.logo && !logoFile && (
                    <button
                      type="button"
                      onClick={handleDeleteLogo}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
                      disabled={isLoading}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Logo
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    onChange={handleLogoChange}
                  />
                </label>

                {/* Upload from Files */}
                <label className="flex flex-col items-center justify-center h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-700 font-medium">Upload Logo</p>
                    <p className="text-xs text-gray-400">PNG, JPG up to 5MB</p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleLogoChange}
                  />
                </label>
              </div>
            )}
          </div>

          {/* Shop Information */}
          <div className="pt-6 border-t">
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
              isLoading={isLoading || isUploadingLogo}
            >
              {isUploadingLogo ? 'Uploading Logo...' : isLoading ? 'Saving...' : 'Save Changes'}
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
