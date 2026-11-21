/** PostgREST `.or()` filter: own user_id OR matching guest email */
export function customerOrdersOrFilter(userId: string, email?: string | null) {
  if (!email) return `user_id.eq.${userId}`;
  const safe = email.replace(/"/g, "");
  return `user_id.eq.${userId},customer_email.eq."${safe}"`;
}
