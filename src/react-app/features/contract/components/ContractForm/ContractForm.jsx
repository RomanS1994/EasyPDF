import { useDispatch } from 'react-redux';

import { ContractWizard } from '../ContractWizard/ContractWizard.jsx';
import { clearContractDraft } from '../../contractStorage.js';
import { resetContract } from '../../contractSlice.js';
import { useContractPersistence } from '../../useContractPersistence.js';
import { useGenerationSessionPersistence } from '../../useGenerationSessionPersistence.js';
import './ContractForm.css';

export function ContractForm() {
  const dispatch = useDispatch();

  useContractPersistence();
  useGenerationSessionPersistence();

  function handleReset() {
    clearContractDraft();
    dispatch(resetContract());
  }

  return (
    <section className="contractForm">
      <div className="contractForm-header">
        <h2 className="contractForm-title">Contract form</h2>
        <p className="contractForm-copy">
          Controlled React inputs wired to Redux Toolkit state.
        </p>
        <button className="contractForm-reset" type="button" onClick={handleReset}>
          Reset draft
        </button>
      </div>

      <ContractWizard />
    </section>
  );
}
