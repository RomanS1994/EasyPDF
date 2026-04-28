import { useDispatch, useSelector } from 'react-redux';

import { selectContract, setTotalPrice } from '../../contractSlice.js';
import { formatPrice, sanitizePriceInput } from '../../utils/priceUtils.js';
import './PriceField.css';

export function PriceField() {
  const dispatch = useDispatch();
  const totalPrice = useSelector(selectContract).totalPrice;

  return (
    <section className="contractSection">
      <h3 className="contractSection-title">Price</h3>

      <label className="contractField">
        <span className="contractField-label">Total price</span>
        <input
          className="contractField-input"
          type="text"
          value={totalPrice}
          onChange={event => {
            const sanitized = sanitizePriceInput(event.target.value);
            const formatted = formatPrice(sanitized);
            dispatch(setTotalPrice(formatted || sanitized));
          }}
        />
      </label>
    </section>
  );
}
