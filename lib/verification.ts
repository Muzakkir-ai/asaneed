export type VerifiedCertificate = {
 registration_number: string; student_name: string; issuer_name: string;
 qiraah_name: string; riwayah_name: string; completion_date: string;
};
export type VerificationResult = { status: 'preparing' | 'not_found' } | { status: 'verified'; certificate: VerifiedCertificate };
export function isVerificationResult(value: unknown): value is VerificationResult {
 if (!value || typeof value !== 'object' || !('status' in value)) return false;
 if (value.status === 'preparing' || value.status === 'not_found') return true;
 if (value.status !== 'verified' || !('certificate' in value) || !value.certificate || typeof value.certificate !== 'object') return false;
 const certificate = value.certificate as Record<string,unknown>;
 return ['registration_number','student_name','issuer_name','qiraah_name','riwayah_name','completion_date'].every(key => typeof certificate[key] === 'string');
}
