const API_BASE = '/api/v1';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('dt_token');
  }

  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Unauthenticated
      if (!endpoint.includes('/auth/login') && !endpoint.includes('/auth/verify-otp')) {
        localStorage.removeItem('dt_token');
        localStorage.removeItem('dt_user');
      }
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || 'API request failed');
    }

    return res.json();
  }

  // Auth
  async login(credentials: { username: string; password: string }) {
    return this.request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) });
  }

  async verifyOtp(payload: { tempToken: string; otp: string }) {
    return this.request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(payload) });
  }

  async demoLogin(role: string, institutionCode?: string) {
    return this.request('/auth/demo-login', {
      method: 'POST',
      body: JSON.stringify({ role, institutionCode }),
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  // FDRs
  async getFdrs(params: Record<string, any> = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    });
    return this.request(`/fdrs?${query.toString()}`);
  }

  async getFdrById(id: string) {
    return this.request(`/fdrs/${id}`);
  }

  async createFdr(data: any) {
    return this.request('/fdrs', { method: 'POST', body: JSON.stringify(data) });
  }

  async resubmitFdr(id: string, data: any) {
    return this.request(`/fdrs/${id}/resubmit`, { method: 'POST', body: JSON.stringify(data) });
  }

  async renewFdr(id: string, data: any) {
    return this.request(`/fdrs/${id}/renew`, { method: 'POST', body: JSON.stringify(data) });
  }

  async addScrutinyNote(id: string, note: string, recommendation: string) {
    return this.request(`/fdrs/${id}/scrutiny-note`, {
      method: 'POST',
      body: JSON.stringify({ note, recommendation }),
    });
  }

  // Documents
  async uploadDocument(formData: FormData) {
    return this.request('/documents/upload', { method: 'POST', body: formData });
  }

  async uploadDocumentVersion(documentId: string, formData: FormData) {
    return this.request(`/documents/${documentId}/version`, { method: 'POST', body: formData });
  }

  async getDocumentVersions(documentId: string) {
    return this.request(`/documents/${documentId}/versions`);
  }

  async getDocumentAccessLogs(documentId: string) {
    return this.request(`/documents/${documentId}/access-logs`);
  }

  async deleteDocument(documentId: string) {
    return this.request(`/documents/${documentId}`, { method: 'DELETE' });
  }

  // OCR
  async extractOcr(formData: FormData) {
    return this.request('/ocr/extract', { method: 'POST', body: formData });
  }

  // Verification
  async verifyFdr(fdrId: string, verificationType: string, manualDetails?: any) {
    return this.request('/verification/verify', {
      method: 'POST',
      body: JSON.stringify({ fdrId, verificationType, manualDetails }),
    });
  }

  async getVerificationComparison(fdrId: string) {
    return this.request(`/verification/comparison/${fdrId}`);
  }

  // Discrepancies
  async getDiscrepancies(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params as any);
    return this.request(`/discrepancies?${query.toString()}`);
  }

  async resolveDiscrepancy(flagId: string, resolutionRemark: string) {
    return this.request(`/discrepancies/${flagId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ resolutionRemark }),
    });
  }

  // Release Workflow
  async checkEligibility(fdrId: string) {
    return this.request(`/release/eligibility/${fdrId}`);
  }

  async createReleaseRequest(data: any) {
    return this.request('/release/requests', { method: 'POST', body: JSON.stringify(data) });
  }

  async getReleaseRequests() {
    return this.request('/release/requests');
  }

  async getReleaseRequestById(id: string) {
    return this.request(`/release/requests/${id}`);
  }

  async scrutinizeRelease(id: string, action: string, observations: string) {
    return this.request(`/release/requests/${id}/scrutinize`, {
      method: 'POST',
      body: JSON.stringify({ action, observations }),
    });
  }

  async decideRelease(id: string, action: string, observations: string) {
    return this.request(`/release/requests/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ action, observations }),
    });
  }

  // Lifecycle & Demo Clock
  async getClockState() {
    return this.request('/lifecycle/clock');
  }

  async shiftClock(days: number) {
    return this.request('/lifecycle/clock', { method: 'POST', body: JSON.stringify({ days }) });
  }

  async resetClock() {
    return this.request('/lifecycle/clock/reset', { method: 'POST' });
  }

  async runScanNow() {
    return this.request('/lifecycle/scan-now', { method: 'POST' });
  }

  async getLifecycleRules() {
    return this.request('/lifecycle/rules');
  }

  // Reports
  async getDashboardStats() {
    return this.request('/reports/dashboard');
  }

  // Notifications & SMS
  async getNotifications() {
    return this.request('/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request(`/notifications/${id}/read`, { method: 'POST' });
  }

  async markAllNotificationsRead() {
    return this.request('/notifications/read-all', { method: 'POST' });
  }

  async getSmsOutbox() {
    return this.request('/notifications/sms-outbox');
  }

  // Integrations
  async getIntegrations() {
    return this.request('/integrations');
  }

  async testIntegration(id: string) {
    return this.request(`/integrations/${id}/test`, { method: 'POST' });
  }

  // Audit Trail
  async getAuditLogs(params: Record<string, any> = {}) {
    const query = new URLSearchParams(params as any);
    return this.request(`/audit?${query.toString()}`);
  }

  async verifyAuditChain() {
    return this.request('/audit/verify-chain');
  }

  async simulateTampering() {
    return this.request('/audit/simulate-tamper', { method: 'POST' });
  }

  async repairAuditChain() {
    return this.request('/audit/repair', { method: 'POST' });
  }

  // Admin
  async resetDemoData() {
    return this.request('/admin/reset-demo-data', { method: 'POST' });
  }

  async getInstitutions() {
    return this.request('/admin/institutions');
  }

  async getBanks() {
    return this.request('/admin/banks');
  }
}

export const api = new ApiClient();
