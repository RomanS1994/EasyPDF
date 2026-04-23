import { contractRefs } from './selectors.js';
import { handleContractInput } from './input.js';

export function bindContractInputEvents() {
  contractRefs.section.addEventListener('input', handleContractInput);

  contractRefs.pages.forEach(page => {
    page.addEventListener('submit', event => {
      event.preventDefault();
    });
  });
}
