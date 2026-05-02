export const ORDER_DETAIL_LABELS = {
  location: '地點：',
  address: '地址：',
  pickupAddress: '取貨地址：'
};

export function formatSpecificDetails({ isPickup = false, locationName = '', address = '' } = {}) {
  const cleanAddress = String(address || '').trim();

  if (isPickup) {
    return `${ORDER_DETAIL_LABELS.pickupAddress}${cleanAddress}`;
  }

  const cleanLocationName = String(locationName || '未提供').trim() || '未提供';
  return `${ORDER_DETAIL_LABELS.location}${cleanLocationName}\n${ORDER_DETAIL_LABELS.address}${cleanAddress}`;
}

export function parseSpecificDetails(rawDetails = '') {
  const details = String(rawDetails || '');
  const lines = details.split('\n');
  const locationLine = lines.find(line => line.startsWith(ORDER_DETAIL_LABELS.location));
  const addressLine = lines.find(
    line => line.startsWith(ORDER_DETAIL_LABELS.address) || line.startsWith(ORDER_DETAIL_LABELS.pickupAddress)
  );
  const hasAddressLabel = details.includes(ORDER_DETAIL_LABELS.address) || details.includes(ORDER_DETAIL_LABELS.pickupAddress);

  return {
    locationName: locationLine ? locationLine.replace(ORDER_DETAIL_LABELS.location, '').trim() : (hasAddressLabel ? '' : details.trim()),
    address: addressLine ? addressLine.replace(/^(地址：|取貨地址：)/, '').trim() : '',
    isPickupDetails: Boolean(addressLine && addressLine.startsWith(ORDER_DETAIL_LABELS.pickupAddress))
  };
}
