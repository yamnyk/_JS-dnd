export function totalsByCategory(orders) {
  return orders.reduce((totals, order) => {
    const soFar = Object.hasOwn(totals, order.category) ? totals[order.category] : 0;
    totals[order.category] = soFar + order.amount;
    return totals;
  }, {});
}
