import { MdLocalGroceryStore, MdLocalDrink, MdCleaningServices, MdHome, MdDevices, MdFastfood, MdLocalFlorist } from 'react-icons/md';

export const CATEGORIES = [
  { key: 'all', label: 'All', Icon: null },
  { key: 'groceries', label: 'Groceries', Icon: MdLocalGroceryStore },
  { key: 'beverages', label: 'Beverages', Icon: MdLocalDrink },
  { key: 'cleaning', label: 'Cleaning', Icon: MdCleaningServices },
  { key: 'home', label: 'Home', Icon: MdHome },
  { key: 'electronics', label: 'Electronics', Icon: MdDevices },
  { key: 'snacks', label: 'Snacks', Icon: MdFastfood },
  { key: 'produce', label: 'Produce', Icon: MdLocalFlorist },
];

export function findCategoryByKey(key) {
  return CATEGORIES.find((c) => c.key === key) || CATEGORIES[0];
}
