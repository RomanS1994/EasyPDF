import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { replaceContract, selectContract, syncBusinessProfile } from './contractSlice.js';
import { loadContractDraft, saveContractDraft } from './contractStorage.js';
import { selectUser } from '../auth/authSlice.js';

function getProfileContractPatch(user) {
  const profile = user?.profile || {};
  const driver = profile.driver || {};
  const provider = profile.provider || {};
  const fallbackName = user?.name || '';

  return {
    driver: {
      name: driver.name || fallbackName,
      address: driver.address || '',
      spz: driver.spz || '',
      ico: driver.ico || '',
    },
    provider: {
      name: provider.name || fallbackName,
      address: provider.address || '',
      ico: provider.ico || '',
    },
  };
}

function hasSameBusinessProfile(contract, patch) {
  return (
    contract?.driver?.name === patch.driver.name &&
    contract?.driver?.address === patch.driver.address &&
    contract?.driver?.spz === patch.driver.spz &&
    contract?.driver?.ico === patch.driver.ico &&
    contract?.provider?.name === patch.provider.name &&
    contract?.provider?.address === patch.provider.address &&
    contract?.provider?.ico === patch.provider.ico
  );
}

export function useContractPersistence() {
  const dispatch = useDispatch();
  const contract = useSelector(selectContract);
  const user = useSelector(selectUser);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const savedContract = loadContractDraft();

    if (savedContract) {
      dispatch(replaceContract(savedContract));
    }

    setIsReady(true);
  }, [dispatch]);

  useEffect(() => {
    if (!isReady || !user) return;

    const nextProfile = getProfileContractPatch(user);

    if (!hasSameBusinessProfile(contract, nextProfile)) {
      dispatch(syncBusinessProfile(nextProfile));
    }
  }, [contract, dispatch, isReady, user]);

  useEffect(() => {
    if (!isReady) return;

    saveContractDraft(contract);
  }, [contract, isReady]);
}
