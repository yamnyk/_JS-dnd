// Breaks on category names that every object already has, like "constructor".
export function totalsByCategory(orders) {
  return orders.reduce((totals, order) => {
    totals[order.category] = (totals[order.category] || 0) + order.amount;
    return totals;
  }, {});
}
