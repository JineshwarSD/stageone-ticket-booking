import { useEffect, useState } from 'react';

import {
  CheckCircle,
  XCircle,
  Clock,
  Users,
  RefreshCw,
} from 'lucide-react';

import toast from 'react-hot-toast';

import api from '../../api/axios';

import Layout from '../../components/Layout';


export default function OrganizerApprovals() {

  const [
    organizers,
    setOrganizers,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    processingId,
    setProcessingId,
  ] = useState(null);


  // ==========================================================
  // LOAD
  // ==========================================================

  async function loadOrganizers() {

    try {

      setLoading(true);

      const response =
        await api.get(
          '/admin/organizers/pending'
        );


      setOrganizers(
        response.data.organizers || []
      );

    } catch (error) {

      console.error(
        error
      );

      toast.error(
        error.response?.data?.message ||
        'Failed to load organizer applications'
      );

    } finally {

      setLoading(false);

    }

  }


  useEffect(() => {

    loadOrganizers();

  }, []);


  // ==========================================================
  // APPROVE
  // ==========================================================

  async function approveOrganizer(
    id
  ) {

    try {

      setProcessingId(id);


      await api.patch(
        `/admin/organizers/${id}/approve`
      );


      toast.success(
        'Organizer approved successfully'
      );


      setOrganizers(
        (current) =>
          current.filter(
            (item) =>
              item.id !== id
          )
      );

    } catch (error) {

      console.error(
        error
      );


      toast.error(
        error.response?.data?.message ||
        'Failed to approve organizer'
      );

    } finally {

      setProcessingId(null);

    }

  }


  // ==========================================================
  // REJECT
  // ==========================================================

  async function rejectOrganizer(
    id
  ) {

    try {

      setProcessingId(id);


      await api.patch(
        `/admin/organizers/${id}/reject`
      );


      toast.success(
        'Organizer rejected'
      );


      setOrganizers(
        (current) =>
          current.filter(
            (item) =>
              item.id !== id
          )
      );

    } catch (error) {

      console.error(
        error
      );


      toast.error(
        error.response?.data?.message ||
        'Failed to reject organizer'
      );

    } finally {

      setProcessingId(null);

    }

  }


  return (

    <Layout>

      <div className="mx-auto max-w-6xl">


        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="mb-8 flex items-center justify-between">

          <div>

            <div className="flex items-center gap-3">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">

                <Users size={24} />

              </div>


              <div>

                <h1 className="text-2xl font-bold text-gray-900">
                  Organizer Approvals
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Review organizer registration requests.
                </p>

              </div>

            </div>

          </div>


          <button
            onClick={loadOrganizers}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
          >

            <RefreshCw
              size={17}
              className={
                loading
                  ? 'animate-spin'
                  : ''
              }
            />

            Refresh

          </button>

        </div>


        {/* ====================================================
            COUNT
        ==================================================== */}

        <div className="mb-6">

          <div className="inline-flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">

              <Clock size={20} />

            </div>


            <div>

              <p className="text-xs font-medium text-gray-500">
                Pending Applications
              </p>

              <p className="text-2xl font-bold text-gray-900">
                {organizers.length}
              </p>

            </div>

          </div>

        </div>


        {/* ====================================================
            LOADING
        ==================================================== */}

        {loading && (

          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">

            <RefreshCw
              size={30}
              className="mx-auto animate-spin text-brand-600"
            />

            <p className="mt-4 text-sm text-gray-500">
              Loading applications...
            </p>

          </div>

        )}


        {/* ====================================================
            EMPTY
        ==================================================== */}

        {!loading &&
          organizers.length === 0 && (

            <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">

              <CheckCircle
                size={42}
                className="mx-auto text-green-500"
              />

              <h2 className="mt-4 text-lg font-bold text-gray-900">
                No pending applications
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                All organizer applications have been reviewed.
              </p>

            </div>

          )}


        {/* ====================================================
            LIST
        ==================================================== */}

        {!loading &&
          organizers.length > 0 && (

            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">


              {/* HEADER */}

              <div className="hidden grid-cols-12 border-b border-gray-100 bg-gray-50 px-6 py-4 text-xs font-bold uppercase tracking-wider text-gray-400 md:grid">

                <div className="col-span-4">
                  Organizer
                </div>

                <div className="col-span-3">
                  Email
                </div>

                <div className="col-span-2">
                  Applied
                </div>

                <div className="col-span-3 text-right">
                  Actions
                </div>

              </div>


              {/* ROWS */}

              {organizers.map(
                (organizer) => {

                  const processing =
                    processingId ===
                    organizer.id;


                  return (

                    <div
                      key={organizer.id}
                      className="grid grid-cols-1 gap-4 border-b border-gray-100 px-6 py-5 last:border-0 md:grid-cols-12 md:items-center"
                    >


                      {/* ORGANIZER */}

                      <div className="md:col-span-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-50 font-bold text-brand-600">

                            {organizer.name
                              ?.charAt(0)
                              ?.toUpperCase()}

                          </div>


                          <div>

                            <p className="font-semibold text-gray-900">
                              {organizer.name}
                            </p>


                            <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">

                              <Clock size={12} />

                              Pending

                            </span>

                          </div>

                        </div>

                      </div>


                      {/* EMAIL */}

                      <div className="md:col-span-3">

                        <p className="text-sm text-gray-600">
                          {organizer.email}
                        </p>

                      </div>


                      {/* DATE */}

                      <div className="md:col-span-2">

                        <p className="text-sm text-gray-600">

                          {new Date(
                            organizer.createdAt
                          ).toLocaleDateString(
                            'en-IN',
                            {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            }
                          )}

                        </p>

                      </div>


                      {/* ACTIONS */}

                      <div className="flex gap-2 md:col-span-3 md:justify-end">

                        <button
                          onClick={() =>
                            rejectOrganizer(
                              organizer.id
                            )
                          }
                          disabled={processing}
                          className="flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >

                          <XCircle size={17} />

                          Reject

                        </button>


                        <button
                          onClick={() =>
                            approveOrganizer(
                              organizer.id
                            )
                          }
                          disabled={processing}
                          className="flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
                        >

                          <CheckCircle size={17} />

                          {processing
                            ? 'Processing...'
                            : 'Approve'}

                        </button>

                      </div>

                    </div>

                  );

                }
              )}

            </div>

          )}

      </div>

    </Layout>

  );

}