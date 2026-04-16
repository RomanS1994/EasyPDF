export function setWizardStep(refs, step) {
  refs.pages.forEach(page => {
    page.classList.toggle('is-active', page.dataset.step === String(step));
  });

  refs.stepTabs.forEach(tab => {
    tab.classList.toggle('is-active', tab.dataset.stepTab === String(step));
  });
}
