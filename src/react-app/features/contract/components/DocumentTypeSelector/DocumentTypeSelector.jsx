import { useDispatch, useSelector } from 'react-redux';

import {
  selectContract,
  setDocumentType,
} from '../../contractSlice.js';
import './DocumentTypeSelector.css';

export function DocumentTypeSelector() {
  const dispatch = useDispatch();
  const documentType = useSelector(selectContract).documentType;

  return (
    <section className="contractSection">
      <h3 className="contractSection-title">Document type</h3>

      <div className="documentTypeSelector">
        <label className="documentTypeSelector-option">
          <input
            type="radio"
            name="documentType"
            value="offer"
            checked={documentType === 'offer'}
            onChange={event => dispatch(setDocumentType(event.target.value))}
          />
          <span>Offer</span>
        </label>

        <label className="documentTypeSelector-option">
          <input
            type="radio"
            name="documentType"
            value="confirmation"
            checked={documentType === 'confirmation'}
            onChange={event => dispatch(setDocumentType(event.target.value))}
          />
          <span>Confirmation</span>
        </label>
      </div>
    </section>
  );
}
