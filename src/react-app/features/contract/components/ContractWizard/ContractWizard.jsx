import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectContract, setOrderNumber, setPassengers, setToday } from '../../contractSlice.js';
import { DocumentTypeSelector } from '../DocumentTypeSelector/DocumentTypeSelector.jsx';
import { DriverFields } from '../DriverFields/DriverFields.jsx';
import { ProviderFields } from '../ProviderFields/ProviderFields.jsx';
import { ProfileFillButton } from '../ProfileFillButton/ProfileFillButton.jsx';
import { CustomerFields } from '../CustomerFields/CustomerFields.jsx';
import { TripFields } from '../TripFields/TripFields.jsx';
import { PriceField } from '../PriceField/PriceField.jsx';
import { ContractActions } from '../ContractActions/ContractActions.jsx';
import { validateStep } from '../../utils/stepValidation.js';
import './ContractWizard.css';

export function ContractWizard() {
  const dispatch = useDispatch();
  const contract = useSelector(selectContract);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState('');

  function handleBack() {
    if (currentStep > 1) {
      setError('');
      setCurrentStep(currentStep - 1);
    }
  }

  function handleNext() {
    const result = validateStep(currentStep, contract);

    if (!result.isValid) {
      if (currentStep === 1) {
        if (result.errors.orderNumber) {
          setError(result.errors.orderNumber);
          return;
        }
        if (result.errors.today) {
          setError(result.errors.today);
          return;
        }
        if (result.errors.documentType) {
          setError(result.errors.documentType);
          return;
        }
      }

      if (currentStep === 2) {
        if (result.errors.driverName) {
          setError(result.errors.driverName);
          return;
        }
        if (result.errors.providerName) {
          setError(result.errors.providerName);
          return;
        }
      }

      if (currentStep === 3) {
        if (result.errors.customerName) {
          setError(result.errors.customerName);
          return;
        }
      }

      if (currentStep === 4) {
        if (result.errors.fromAddress) {
          setError(result.errors.fromAddress);
          return;
        }
        if (result.errors.toAddress) {
          setError(result.errors.toAddress);
          return;
        }
        if (result.errors.tripTime) {
          setError(result.errors.tripTime);
          return;
        }
        if (result.errors.totalPrice) {
          setError(result.errors.totalPrice);
          return;
        }
      }
    }

    setError('');

    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  }

  let title = 'Document';
  let content = (
    <div className="contractWizard-step">
      <DocumentTypeSelector />

      <label className="contractWizard-field">
        <span>Order number</span>
        <input
          type="text"
          value={contract.orderNumber}
          onChange={event => dispatch(setOrderNumber(event.target.value))}
        />
      </label>

      <label className="contractWizard-field">
        <span>Today</span>
        <input
          type="date"
          value={contract.today}
          onChange={event => dispatch(setToday(event.target.value))}
        />
      </label>
    </div>
  );

  if (currentStep === 2) {
    title = 'Business';
    content = (
      <div className="contractWizard-step">
        <ProfileFillButton />
        <DriverFields />
        <ProviderFields />
      </div>
    );
  }

  if (currentStep === 3) {
    title = 'Customer';
    content = (
      <div className="contractWizard-step">
        <CustomerFields />

        <label className="contractWizard-field">
          <span>Passengers</span>
          <input
            type="text"
            value={contract.passengers}
            onChange={event => dispatch(setPassengers(event.target.value))}
          />
        </label>
      </div>
    );
  }

  if (currentStep === 4) {
    title = 'Trip';
    content = (
      <div className="contractWizard-step">
        <TripFields />
        <PriceField />
      </div>
    );
  }

  if (currentStep === 5) {
    title = 'Actions';
    content = (
      <div className="contractWizard-step">
        <ContractActions />
      </div>
    );
  }

  return (
    <section className="contractWizard">
      <div className="contractWizard-header">
        <h3 className="contractWizard-title">{title}</h3>
        <p className="contractWizard-copy">Step {currentStep} of 5</p>
      </div>

      {error ? <p className="contractWizard-error">{error}</p> : null}

      {content}

      <div className="contractWizard-nav">
        <button
          className="contractWizard-button"
          type="button"
          onClick={handleBack}
          disabled={currentStep === 1}
        >
          Back
        </button>

        {currentStep < 5 ? (
          <button className="contractWizard-button" type="button" onClick={handleNext}>
            Next
          </button>
        ) : null}
      </div>
    </section>
  );
}
