import { contractRefs } from './selectors.js';
import { applyContractScale } from './ui.js';
import { setWizardStep } from './wizard.js';

export function bindContractWizardNavigation() {
  contractRefs.stepTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      setWizardStep(contractRefs, tab.dataset.stepTab || '1');
      applyContractScale();
    });
  });

  contractRefs.nextButtons.forEach(button => {
    button.addEventListener('click', () => {
      setWizardStep(contractRefs, button.dataset.next || '2');
      applyContractScale();
    });
  });

  contractRefs.backButtons.forEach(button => {
    button.addEventListener('click', () => {
      setWizardStep(contractRefs, button.dataset.prev || '1');
      applyContractScale();
    });
  });
}
