/**
 * Internal WhatsApp Setup Queue Management Page
 * SUPER_ADMIN only - Manage WhatsApp Business API setup requests
 */

import { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import type { WhatsAppSetupRequest, WhatsAppSetupStatus } from '../types';
import { internalApi } from '../services/api';
import { useAuthStore } from '../store/authStore';

const statusSeverity: Record<WhatsAppSetupStatus, 'success' | 'info' | 'warning' | 'danger'> = {
  PENDING: 'info',
  PROCESSING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  FAILED: 'danger',
};

const statusOptions = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

export default function InternalWhatsAppQueuePage() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<WhatsAppSetupRequest[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<WhatsAppSetupRequest | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Complete setup form state
  const [completeFormData, setCompleteFormData] = useState({
    metaBusinessId: '',
    whatsappPhoneNumberId: '',
    whatsappAccessToken: '',
    whatsappBusinessAccountId: '',
    statusMessage: '',
  });
  const [completeLoading, setCompleteLoading] = useState(false);

  // Check if user is SUPER_ADMIN
  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-4">
        <Message severity="error" text="Access Denied: This page is only accessible to internal team members." />
      </div>
    );
  }

  useEffect(() => {
    loadQueue();
  }, [statusFilter]);

  const loadQueue = async () => {
    try {
      setLoading(true);
      const response = await internalApi.getWhatsAppQueue(statusFilter || undefined);
      setRequests(response.requests);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load queue:', err);
      setError(err.response?.data?.error || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request: WhatsAppSetupRequest) => {
    setSelectedRequest(request);
    setShowDetailsDialog(true);
  };

  const handleStartProcessing = async (request: WhatsAppSetupRequest) => {
    try {
      await internalApi.updateRequestStatus(request.id, {
        status: 'PROCESSING',
        assignedToUser: user?.username,
        statusMessage: 'Setup in progress',
      });
      await loadQueue();
    } catch (err: any) {
      console.error('Failed to update status:', err);
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleReject = async (request: WhatsAppSetupRequest) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await internalApi.updateRequestStatus(request.id, {
        status: 'REJECTED',
        statusMessage: reason,
      });
      await loadQueue();
    } catch (err: any) {
      console.error('Failed to reject:', err);
      setError(err.response?.data?.error || 'Failed to reject request');
    }
  };

  const handleOpenCompleteDialog = (request: WhatsAppSetupRequest) => {
    setSelectedRequest(request);
    setCompleteFormData({
      metaBusinessId: '',
      whatsappPhoneNumberId: '',
      whatsappAccessToken: '',
      whatsappBusinessAccountId: '',
      statusMessage: 'WhatsApp API configured successfully',
    });
    setShowCompleteDialog(true);
  };

  const handleCompleteSetup = async () => {
    if (!selectedRequest) return;

    try {
      setCompleteLoading(true);
      await internalApi.completeSetup(selectedRequest.id, completeFormData);
      setShowCompleteDialog(false);
      await loadQueue();
    } catch (err: any) {
      console.error('Failed to complete setup:', err);
      setError(err.response?.data?.error || 'Failed to complete setup');
    } finally {
      setCompleteLoading(false);
    }
  };

  const statusBodyTemplate = (rowData: WhatsAppSetupRequest) => {
    return <Tag value={rowData.status} severity={statusSeverity[rowData.status]} />;
  };

  const actionsBodyTemplate = (rowData: WhatsAppSetupRequest) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          size="small"
          outlined
          onClick={() => handleViewDetails(rowData)}
          tooltip="View Details"
        />
        {rowData.status === 'PENDING' && (
          <>
            <Button
              icon="pi pi-play"
              size="small"
              severity="info"
              onClick={() => handleStartProcessing(rowData)}
              tooltip="Start Processing"
            />
            <Button
              icon="pi pi-times"
              size="small"
              severity="danger"
              outlined
              onClick={() => handleReject(rowData)}
              tooltip="Reject"
            />
          </>
        )}
        {rowData.status === 'PROCESSING' && (
          <>
            <Button
              icon="pi pi-check"
              size="small"
              severity="success"
              onClick={() => handleOpenCompleteDialog(rowData)}
              tooltip="Complete Setup"
            />
            <Button
              icon="pi pi-times"
              size="small"
              severity="danger"
              outlined
              onClick={() => handleReject(rowData)}
              tooltip="Reject"
            />
          </>
        )}
      </div>
    );
  };

  const dateBodyTemplate = (rowData: WhatsAppSetupRequest) => {
    return new Date(rowData.submittedAt).toLocaleString();
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <ProgressSpinner />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">WhatsApp Setup Queue</h1>

      {error && <Message severity="error" text={error} className="mb-4" />}

      <Card>
        <div className="flex justify-content-between align-items-center mb-4">
          <div className="flex align-items-center gap-2">
            <label>Filter by Status:</label>
            <Dropdown
              value={statusFilter}
              options={statusOptions}
              onChange={(e) => setStatusFilter(e.value)}
              style={{ width: '200px' }}
            />
          </div>
          <Button
            icon="pi pi-refresh"
            label="Refresh"
            onClick={loadQueue}
            loading={loading}
          />
        </div>

        <DataTable
          value={requests}
          loading={loading}
          paginator
          rows={10}
          emptyMessage="No setup requests found"
          dataKey="id"
        >
          <Column field="id" header="ID" style={{ width: '80px' }} />
          <Column field="businessName" header="Business Name" />
          <Column field="shop.name" header="Shop Name" />
          <Column field="ownerName" header="Owner" />
          <Column field="phoneNumber" header="Phone" />
          <Column field="status" header="Status" body={statusBodyTemplate} />
          <Column field="submittedAt" header="Submitted" body={dateBodyTemplate} />
          <Column field="assignedToUser" header="Assigned To" />
          <Column header="Actions" body={actionsBodyTemplate} style={{ width: '200px' }} />
        </DataTable>
      </Card>

      {/* Details Dialog */}
      <Dialog
        header="Setup Request Details"
        visible={showDetailsDialog}
        style={{ width: '50vw' }}
        onHide={() => setShowDetailsDialog(false)}
      >
        {selectedRequest && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>ID:</strong> {selectedRequest.id}</p>
              <p><strong>Business Name:</strong> {selectedRequest.businessName}</p>
              <p><strong>Owner:</strong> {selectedRequest.ownerName}</p>
              <p><strong>Email:</strong> {selectedRequest.ownerEmail}</p>
              <p><strong>Phone:</strong> {selectedRequest.phoneNumber}</p>
              <p><strong>Category:</strong> {selectedRequest.businessCategory}</p>
            </div>
            <div>
              <p><strong>Status:</strong> <Tag value={selectedRequest.status} severity={statusSeverity[selectedRequest.status]} /></p>
              <p><strong>Submitted:</strong> {new Date(selectedRequest.submittedAt).toLocaleString()}</p>
              <p><strong>Assigned To:</strong> {selectedRequest.assignedToUser || 'Unassigned'}</p>
              {selectedRequest.statusMessage && (
                <p><strong>Status Message:</strong> {selectedRequest.statusMessage}</p>
              )}
            </div>
            <div className="col-span-2">
              <p><strong>Address:</strong> {selectedRequest.businessAddress}</p>
              {selectedRequest.businessDescription && (
                <p><strong>Description:</strong> {selectedRequest.businessDescription}</p>
              )}
              {selectedRequest.gstNumber && (
                <p><strong>GST Number:</strong> {selectedRequest.gstNumber}</p>
              )}
              {selectedRequest.panNumber && (
                <p><strong>PAN Number:</strong> {selectedRequest.panNumber}</p>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Complete Setup Dialog */}
      <Dialog
        header="Complete WhatsApp Setup"
        visible={showCompleteDialog}
        style={{ width: '50vw' }}
        onHide={() => setShowCompleteDialog(false)}
      >
        <div className="flex flex-col gap-4">
          <div>
            <label htmlFor="metaBusinessId" className="block mb-2 font-semibold">Meta Business ID *</label>
            <InputText
              id="metaBusinessId"
              value={completeFormData.metaBusinessId}
              onChange={(e) => setCompleteFormData({ ...completeFormData, metaBusinessId: e.target.value })}
              className="w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="whatsappPhoneNumberId" className="block mb-2 font-semibold">WhatsApp Phone Number ID *</label>
            <InputText
              id="whatsappPhoneNumberId"
              value={completeFormData.whatsappPhoneNumberId}
              onChange={(e) => setCompleteFormData({ ...completeFormData, whatsappPhoneNumberId: e.target.value })}
              className="w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="whatsappBusinessAccountId" className="block mb-2 font-semibold">WhatsApp Business Account ID *</label>
            <InputText
              id="whatsappBusinessAccountId"
              value={completeFormData.whatsappBusinessAccountId}
              onChange={(e) => setCompleteFormData({ ...completeFormData, whatsappBusinessAccountId: e.target.value })}
              className="w-full"
              required
            />
          </div>

          <div>
            <label htmlFor="whatsappAccessToken" className="block mb-2 font-semibold">WhatsApp Access Token *</label>
            <InputTextarea
              id="whatsappAccessToken"
              value={completeFormData.whatsappAccessToken}
              onChange={(e) => setCompleteFormData({ ...completeFormData, whatsappAccessToken: e.target.value })}
              className="w-full"
              rows={3}
              required
            />
          </div>

          <div>
            <label htmlFor="statusMessage" className="block mb-2 font-semibold">Status Message</label>
            <InputTextarea
              id="statusMessage"
              value={completeFormData.statusMessage}
              onChange={(e) => setCompleteFormData({ ...completeFormData, statusMessage: e.target.value })}
              className="w-full"
              rows={2}
            />
          </div>

          <div className="flex justify-content-end gap-2">
            <Button
              label="Cancel"
              severity="secondary"
              outlined
              onClick={() => setShowCompleteDialog(false)}
            />
            <Button
              label="Complete Setup"
              icon="pi pi-check"
              severity="success"
              onClick={handleCompleteSetup}
              loading={completeLoading}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
