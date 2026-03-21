/**
 * WhatsApp Setup Page
 * Allows shop owners to request WhatsApp Business API setup
 */

import { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload, type FileUploadHandlerEvent } from 'primereact/fileupload';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { Panel } from 'primereact/panel';
import { Divider } from 'primereact/divider';
import type {
  BusinessCategory,
  WhatsAppSetupFormData,
  WhatsAppSetupStatusResponse,
  WhatsAppSetupStatus
} from '../types';
import { whatsappApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

const businessCategories: { label: string; value: BusinessCategory }[] = [
  { label: 'Retail', value: 'RETAIL' },
  { label: 'Grocery', value: 'GROCERY' },
  { label: 'Electronics', value: 'ELECTRONICS' },
  { label: 'Fashion & Apparel', value: 'FASHION' },
  { label: 'Pharmacy', value: 'PHARMACY' },
  { label: 'Restaurant & Food', value: 'RESTAURANT' },
  { label: 'Services', value: 'SERVICES' },
  { label: 'Other', value: 'OTHER' },
];

const statusSeverity: Record<WhatsAppSetupStatus, 'success' | 'info' | 'warn' | 'danger'> = {
  PENDING: 'info',
  PROCESSING: 'warn',
  APPROVED: 'success',
  REJECTED: 'danger',
  FAILED: 'danger',
};

export default function WhatsAppSetupPage() {
  const { user, shop } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState<WhatsAppSetupStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<WhatsAppSetupFormData>({
    businessName: shop?.name || '',
    businessAddress: shop?.address || '',
    gstNumber: shop?.gstNumber || '',
    panNumber: '',
    phoneNumber: shop?.whatsappNumber || '',
    ownerName: shop?.ownerName || '',
    ownerEmail: user?.username || '',
    businessCategory: 'RETAIL',
    businessDescription: '',
    gstCertificateUrl: '',
    shopPhotoUrl: '',
  });

  // Load current status
  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    if (!shop?.id) return;

    try {
      setStatusLoading(true);
      const response = await whatsappApi.getStatus(shop.id);
      setCurrentStatus(response);
    } catch (err) {
      console.error('Failed to load WhatsApp status:', err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleInputChange = (field: keyof WhatsAppSetupFormData, value: string | BusinessCategory) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (event: FileUploadHandlerEvent, field: 'gstCertificateUrl' | 'shopPhotoUrl') => {
    if (!shop?.id) return;

    try {
      const formData = new FormData();
      const files = event.files;

      if (field === 'gstCertificateUrl' && files[0]) {
        formData.append('gstCertificate', files[0]);
      } else if (field === 'shopPhotoUrl' && files[0]) {
        formData.append('shopPhoto', files[0]);
      }

      const response = await whatsappApi.uploadDocuments(shop.id, formData);

      if (response.success) {
        if (field === 'gstCertificateUrl' && response.gstCertificateUrl) {
          setFormData((prev) => ({ ...prev, gstCertificateUrl: response.gstCertificateUrl! }));
        } else if (field === 'shopPhotoUrl' && response.shopPhotoUrl) {
          setFormData((prev) => ({ ...prev, shopPhotoUrl: response.shopPhotoUrl! }));
        }
      }
    } catch (err) {
      console.error('File upload failed:', err);
      setError('Failed to upload file. Please try again.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop?.id) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await whatsappApi.submitSetupRequest(shop.id, formData);
      setSuccess(true);
      await loadStatus(); // Reload status
    } catch (err: any) {
      console.error('Setup request failed:', err);
      setError(err.response?.data?.error || 'Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (statusLoading) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <ProgressSpinner />
      </div>
    );
  }

  // Show status if already submitted
  if (currentStatus?.setupRequest) {
    const request = currentStatus.setupRequest;
    const shopStatus = currentStatus.shop;

    return (
      <div className="p-4">
        <h1 className="text-3xl font-bold mb-4">WhatsApp Business API Setup</h1>

        {shopStatus.whatsappEnabled && shopStatus.whatsappVerified && (
          <Message severity="success" text="WhatsApp Business API is active for your shop!" className="mb-4" />
        )}

        <Card title="Setup Request Status" className="mb-4">
          <div className="grid">
            <div className="col-12 md:col-6">
              <p><strong>Business Name:</strong> {request.businessName}</p>
              <p><strong>Phone Number:</strong> {request.phoneNumber}</p>
              <p><strong>Category:</strong> {request.businessCategory}</p>
            </div>
            <div className="col-12 md:col-6">
              <p><strong>Submitted:</strong> {new Date(request.submittedAt).toLocaleDateString()}</p>
              <p><strong>Status:</strong> <Tag value={request.status} severity={statusSeverity[request.status]} /></p>
              {request.statusMessage && <p><strong>Message:</strong> {request.statusMessage}</p>}
            </div>
          </div>

          {request.status === 'PENDING' && (
            <Message severity="info" text="Your request is pending review. Our team will contact you shortly." className="mt-3" />
          )}

          {request.status === 'PROCESSING' && (
            <Message severity="warn" text="Your request is being processed. We're setting up your WhatsApp Business API." className="mt-3" />
          )}

          {request.status === 'REJECTED' && (
            <div className="mt-3">
              <Message severity="error" text={request.statusMessage || 'Your request was rejected.'} />
              <Button label="Submit New Request" icon="pi pi-refresh" className="mt-3" onClick={() => window.location.reload()} />
            </div>
          )}
        </Card>

        {shopStatus.whatsappEnabled && (
          <Panel header="WhatsApp Settings" className="mt-4">
            <div className="flex justify-content-between align-items-center">
              <div>
                <p><strong>Status:</strong> {shopStatus.whatsappVerified ? 'Verified ✓' : 'Not Verified'}</p>
                <p><strong>Setup Date:</strong> {shopStatus.setupDate ? new Date(shopStatus.setupDate).toLocaleDateString() : 'N/A'}</p>
              </div>
              <Button
                label="Disable WhatsApp"
                icon="pi pi-times"
                severity="danger"
                outlined
                onClick={async () => {
                  if (confirm('Are you sure you want to disable WhatsApp Business API?')) {
                    try {
                      await whatsappApi.disable(shop.id);
                      await loadStatus();
                    } catch (err) {
                      console.error('Failed to disable WhatsApp:', err);
                    }
                  }
                }}
              />
            </div>
          </Panel>
        )}
      </div>
    );
  }

  // Show request form
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Request WhatsApp Business API Setup</h1>

      <Message
        severity="info"
        text="Enable WhatsApp Business API to send automated order notifications to customers. Our team will help you set up and verify your business with Meta."
        className="mb-4"
      />

      {error && <Message severity="error" text={error} className="mb-4" />}
      {success && <Message severity="success" text="Request submitted successfully! Our team will contact you soon." className="mb-4" />}

      <form onSubmit={handleSubmit}>
        <Card title="Business Information">
          <div className="grid p-fluid">
            <div className="col-12 md:col-6">
              <label htmlFor="businessName" className="block mb-2 font-semibold">Business Name *</label>
              <InputText
                id="businessName"
                value={formData.businessName}
                onChange={(e) => handleInputChange('businessName', e.target.value)}
                required
              />
            </div>

            <div className="col-12 md:col-6">
              <label htmlFor="businessCategory" className="block mb-2 font-semibold">Business Category *</label>
              <Dropdown
                id="businessCategory"
                value={formData.businessCategory}
                options={businessCategories}
                onChange={(e) => handleInputChange('businessCategory', e.value)}
                required
              />
            </div>

            <div className="col-12">
              <label htmlFor="businessAddress" className="block mb-2 font-semibold">Business Address *</label>
              <InputTextarea
                id="businessAddress"
                value={formData.businessAddress}
                onChange={(e) => handleInputChange('businessAddress', e.target.value)}
                rows={3}
                required
              />
            </div>

            <div className="col-12">
              <label htmlFor="businessDescription" className="block mb-2 font-semibold">Business Description (Optional)</label>
              <InputTextarea
                id="businessDescription"
                value={formData.businessDescription}
                onChange={(e) => handleInputChange('businessDescription', e.target.value)}
                rows={3}
                placeholder="Brief description of your business"
              />
            </div>
          </div>
        </Card>

        <Divider />

        <Card title="Tax Information" className="mt-4">
          <div className="grid p-fluid">
            <div className="col-12 md:col-6">
              <label htmlFor="gstNumber" className="block mb-2 font-semibold">GST Number (Optional)</label>
              <InputText
                id="gstNumber"
                value={formData.gstNumber}
                onChange={(e) => handleInputChange('gstNumber', e.target.value)}
                placeholder="22AAAAA0000A1Z5"
              />
            </div>

            <div className="col-12 md:col-6">
              <label htmlFor="panNumber" className="block mb-2 font-semibold">PAN Number (Optional)</label>
              <InputText
                id="panNumber"
                value={formData.panNumber}
                onChange={(e) => handleInputChange('panNumber', e.target.value)}
                placeholder="AAAAA0000A"
              />
            </div>

            <div className="col-12 md:col-6">
              <label className="block mb-2 font-semibold">GST Certificate (Optional)</label>
              <FileUpload
                mode="basic"
                name="gstCertificate"
                accept="image/*,application/pdf"
                maxFileSize={5000000}
                customUpload
                uploadHandler={(e) => handleFileUpload(e, 'gstCertificateUrl')}
                chooseLabel="Upload GST Certificate"
              />
              {formData.gstCertificateUrl && (
                <small className="text-green-600">✓ Uploaded</small>
              )}
            </div>

            <div className="col-12 md:col-6">
              <label className="block mb-2 font-semibold">Shop Photo (Optional)</label>
              <FileUpload
                mode="basic"
                name="shopPhoto"
                accept="image/*"
                maxFileSize={5000000}
                customUpload
                uploadHandler={(e) => handleFileUpload(e, 'shopPhotoUrl')}
                chooseLabel="Upload Shop Photo"
              />
              {formData.shopPhotoUrl && (
                <small className="text-green-600">✓ Uploaded</small>
              )}
            </div>
          </div>
        </Card>

        <Divider />

        <Card title="Contact Information" className="mt-4">
          <div className="grid p-fluid">
            <div className="col-12 md:col-6">
              <label htmlFor="ownerName" className="block mb-2 font-semibold">Owner Name *</label>
              <InputText
                id="ownerName"
                value={formData.ownerName}
                onChange={(e) => handleInputChange('ownerName', e.target.value)}
                required
              />
            </div>

            <div className="col-12 md:col-6">
              <label htmlFor="ownerEmail" className="block mb-2 font-semibold">Owner Email *</label>
              <InputText
                id="ownerEmail"
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                required
              />
            </div>

            <div className="col-12 md:col-6">
              <label htmlFor="phoneNumber" className="block mb-2 font-semibold">WhatsApp Phone Number *</label>
              <InputText
                id="phoneNumber"
                value={formData.phoneNumber}
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                placeholder="+919999999999"
                required
              />
              <small className="text-gray-600">Include country code (e.g., +91 for India)</small>
            </div>
          </div>
        </Card>

        <div className="mt-4 flex gap-2">
          <Button
            type="submit"
            label="Submit Request"
            icon="pi pi-check"
            loading={loading}
          />
          <Button
            type="button"
            label="Cancel"
            icon="pi pi-times"
            severity="secondary"
            outlined
            onClick={() => window.history.back()}
          />
        </div>
      </form>
    </div>
  );
}
