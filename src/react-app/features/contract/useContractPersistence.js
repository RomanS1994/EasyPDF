import { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { replaceContract, selectContract } from './contractSlice.js';
import { loadContractDraft, saveContractDraft } from './contractStorage.js';

export function useContractPersistence() {
  const dispatch = useDispatch();
  const contract = useSelector(selectContract);
  const isReady = useRef(false);

  useEffect(() => {
    const savedContract = loadContractDraft();

    if (savedContract) {
      dispatch(replaceContract(savedContract));
    }

    isReady.current = true;
  }, [dispatch]);

  useEffect(() => {
    if (!isReady.current) return;

    saveContractDraft(contract);
  }, [contract]);
}
