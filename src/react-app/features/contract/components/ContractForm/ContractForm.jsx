import { useContractPersistence } from '../../useContractPersistence.js';
import { CustomerFields } from '../CustomerFields/CustomerFields.jsx';
import { TripFields } from '../TripFields/TripFields.jsx';
import { ContractActions } from '../ContractActions/ContractActions.jsx';
import { PriceField } from '../PriceField/PriceField.jsx';
import './ContractForm.css';

export function ContractForm() {
  useContractPersistence();

  return (
    <section className="contractForm">
      <div className="contractForm-header">
        <h2 className="contractForm-title">Contract form</h2>
      </div>

      <div className="contractForm-grid">
        <section className="contractSection">
          <h3 className="contractSection-title">Passenger</h3>
          <CustomerFields />
        </section>

        <section className="contractSection">
          <h3 className="contractSection-title">Trip</h3>
          <TripFields />
        </section>

        <PriceField />

        <ContractActions />
      </div>
    </section>
  );
}
