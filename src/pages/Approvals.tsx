import { ApprovalQueue } from '@/components/approvals/ApprovalQueue';

export function Approvals() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Approvals</h1>
        <p className="text-sm text-gray-500 mt-1">Review and approve requisitions and payslips</p>
      </div>
      <ApprovalQueue />
    </div>
  );
}