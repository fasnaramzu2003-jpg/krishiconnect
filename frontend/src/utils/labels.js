
export const RUPEE = '\u20B9'

export const ACTIVITY_TYPES = [
  { value: 'sowing', label: 'Sowing or planting' },
  { value: 'irrigation', label: 'Irrigation' },
  { value: 'fertilizer', label: 'Fertilizer' },
  { value: 'pesticide', label: 'Pesticide' },
  { value: 'weeding', label: 'Weeding' },
  { value: 'harvest', label: 'Harvest' },
  { value: 'other', label: 'Other' },
]

export const STATUS_LABELS = {
  planned: 'Planned',
  growing: 'Growing',
  harvested: 'Harvested',
}

export const UNIT_OPTIONS = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'dozen', label: 'Dozen' },
  { value: 'piece', label: 'Piece' },
  { value: 'bunch', label: 'Bunch' },
  { value: 'litre', label: 'Litre' },
]

export const LISTING_STATUS_LABELS = {
  active: 'Active',
  paused: 'Paused',
  sold_out: 'Sold out',
  removed: 'Removed by moderator',
}


export const ORDER_STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}


export const GROUP_STATUS_LABELS = {
  open: 'Open',
  filled: 'Fully pledged',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
}
