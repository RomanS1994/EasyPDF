import { baseApi } from '../../app/api/baseApi.js';

export const contractApi = baseApi.injectEndpoints({
  endpoints: builder => ({
    generateContractPdf: builder.mutation({
      query: ({ contractData, orderId, documentType, language = 'uk' }) => ({
        url: '/contracts/get-pdf',
        method: 'POST',
        body: {
          contractData,
          orderId,
          documentType,
          language,
        },
        responseHandler: response => response.blob(),
      }),
    }),
  }),
});

export const { useGenerateContractPdfMutation } = contractApi;
