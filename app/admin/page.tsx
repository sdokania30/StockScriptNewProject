import { ApproveUserButton } from "@/components/approve-user-button";
import { requireAdmin } from "@/lib/auth";
import { getPendingUsers } from "@/lib/queries";
import { formatDateTime } from "@/lib/format";

export default async function AdminPage() {
  await requireAdmin();
  const pendingUsers = await getPendingUsers();

  return (
    <div className="space-y-8">
      <section className="rounded-[36px] border border-[#e2d6b1] bg-white/95 p-7 shadow-soft">
        <p className="text-sm uppercase tracking-[0.24em] text-[#9d7a1f]">Admin Desk</p>
        <h1 className="mt-2 font-display text-4xl font-semibold text-ink">
          Validate trader accounts
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
          Traders only gain posting access after their email is verified and the admin approves the account.
        </p>
      </section>

      <section className="overflow-hidden rounded-[32px] border border-[#e2d6b1] bg-white/95 shadow-soft">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="bg-[linear-gradient(180deg,#d6b24f_0%,#9d7a1f_100%)] text-sm uppercase tracking-[0.18em] text-white">
              <tr>
                <th className="px-5 py-4">Trader</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Email Verified</th>
                <th className="px-5 py-4">Created</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((user) => (
                <tr key={user.id} className="border-b border-[#f0e7cf] last:border-transparent">
                  <td className="px-5 py-5 font-display text-xl font-semibold text-ink">
                    {user.name}
                  </td>
                  <td className="px-5 py-5 text-slate-700">{user.email}</td>
                  <td className="px-5 py-5 text-slate-700">
                    {user.emailVerifiedAt ? formatDateTime(user.emailVerifiedAt) : "Awaiting verification"}
                  </td>
                  <td className="px-5 py-5 text-slate-700">{formatDateTime(user.createdAt)}</td>
                  <td className="px-5 py-5">
                    {user.emailVerifiedAt ? (
                      <ApproveUserButton userId={user.id} />
                    ) : (
                      <span className="text-sm text-slate-500">Waiting for email verification</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
