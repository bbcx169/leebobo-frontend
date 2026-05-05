import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { products } from '../constants/data';

const PRODUCT_AVAILABILITY_DOC = doc(db, 'settings', 'productAvailability');

export const getDefaultProductAvailability = () => {
  return products.reduce((availability, product) => {
    availability[String(product.id)] = true;
    return availability;
  }, {});
};

export const normalizeProductAvailability = (availability = {}) => {
  const defaults = getDefaultProductAvailability();
  return {
    ...defaults,
    ...Object.fromEntries(
      Object.entries(availability).map(([id, enabled]) => [String(id), Boolean(enabled)])
    )
  };
};

export const fetchProductAvailability = async () => {
  const snapshot = await getDoc(PRODUCT_AVAILABILITY_DOC);
  if (!snapshot.exists()) {
    return getDefaultProductAvailability();
  }

  return normalizeProductAvailability(snapshot.data().products);
};

export const saveProductAvailability = async (availability) => {
  const normalizedAvailability = normalizeProductAvailability(availability);
  await setDoc(
    PRODUCT_AVAILABILITY_DOC,
    {
      products: normalizedAvailability,
      updatedAt: new Date().toISOString()
    },
    { merge: true }
  );

  return normalizedAvailability;
};
