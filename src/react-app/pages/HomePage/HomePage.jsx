import { ContractForm } from '../../features/contract/components/ContractForm/ContractForm.jsx';
import './HomePage.css';

export function HomePage() {
  return (
    <div className="reactTestPage">
      <section className="reactTestPage-intro">
        <h2 className="reactTestPage-title">Contract editor</h2>
        <p className="reactTestPage-copy">
          This route uses controlled React inputs connected to Redux Toolkit.
        </p>
      </section>

      <ContractForm />
    </div>
  );
}
