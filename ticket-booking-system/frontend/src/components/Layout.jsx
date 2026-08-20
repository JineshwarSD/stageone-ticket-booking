import {
  NavLink,
  useNavigate,
} from 'react-router-dom';

import {
  Ticket,
  LayoutDashboard,
  CalendarPlus,
  Building2,
  History,
  LogOut,
  Clapperboard,
  Settings,
  UserCheck,
  BarChart3,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';


// ============================================================
// NAVIGATION
// ============================================================

const NAV = {

  ADMIN: [
    {
      to: '/admin/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/admin/organizers',
      label: 'Organizer Approvals',
      icon: UserCheck,
    },
    {
      to: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
    {
      to: '/admin/venues',
      label: 'Venues',
      icon: Building2,
    },
  ],

  ORGANISER: [
    {
      to: '/organiser/events',
      label: 'My Events',
      icon: CalendarPlus,
    },
    {
      to: '/analytics',
      label: 'Analytics',
      icon: BarChart3,
    },
  ],

  CUSTOMER: [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      to: '/events',
      label: 'Browse Events',
      icon: Clapperboard,
    },
    {
      to: '/bookings',
      label: 'My Bookings',
      icon: History,
    },
  ],

};


// ============================================================
// LAYOUT
// ============================================================

export default function Layout({ children }) {

  const {
    user,
    logout,
  } = useAuth();

  const navigate = useNavigate();

  const items =
    NAV[user?.role] || [];


  // ==========================================================
  // LOGOUT
  // ==========================================================

  function handleLogout() {

    logout();

    navigate('/login');

  }


  // ==========================================================
  // LAYOUT
  // ==========================================================

  return (

    <div className="flex min-h-screen bg-gray-50">


      {/* ======================================================
          SIDEBAR
          ====================================================== */}

      <aside
        className="
          hidden
          w-64
          flex-col
          border-r
          border-gray-100
          bg-white
          md:flex
        "
      >


        {/* ====================================================
            LOGO
            ==================================================== */}

        <div
          className="
            border-b
            border-gray-100
            px-5
            py-6
          "
        >

          <div
            className="
              flex
              items-center
              gap-3
            "
          >

            <div
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-xl
                bg-brand-600
                text-white
                shadow-sm
              "
            >

              <Ticket size={22} />

            </div>


            <div>

              <p
                className="
                  text-lg
                  font-bold
                  text-gray-900
                "
              >
                StageOne
              </p>


              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.18em]
                  text-gray-400
                "
              >
                Ticketing Platform
              </p>

            </div>

          </div>

        </div>


        {/* ====================================================
            NAVIGATION
            ==================================================== */}

        <div
          className="
            flex-1
            px-4
            py-7
          "
        >

          <p
            className="
              mb-4
              px-2
              text-xs
              font-bold
              uppercase
              tracking-wider
              text-gray-400
            "
          >
            Workspace
          </p>


          <nav className="space-y-1">

            {items.map(
              ({
                to,
                label,
                icon: Icon,
              }) => (

                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `
                    group
                    flex
                    items-center
                    gap-3
                    rounded-xl
                    px-3
                    py-3
                    text-sm
                    font-medium
                    transition
                    ${
                      isActive
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                    `
                  }
                >

                  {({ isActive }) => (

                    <>

                      <Icon
                        size={19}
                        className={
                          isActive
                            ? 'text-brand-600'
                            : 'text-gray-400 group-hover:text-gray-600'
                        }
                      />


                      <span>
                        {label}
                      </span>


                      {isActive && (

                        <span
                          className="
                            ml-auto
                            h-1.5
                            w-1.5
                            rounded-full
                            bg-brand-600
                          "
                        />

                      )}

                    </>

                  )}

                </NavLink>

              )
            )}

          </nav>


          {/* ==================================================
              ACCOUNT
              ================================================== */}

          <p
            className="
              mb-4
              mt-10
              px-2
              text-xs
              font-bold
              uppercase
              tracking-wider
              text-gray-400
            "
          >
            Account
          </p>


          <button
            onClick={() =>
              navigate('/settings')
            }
            className="
              group
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              px-3
              py-3
              text-sm
              font-medium
              text-gray-600
              transition
              hover:bg-gray-50
              hover:text-gray-900
            "
          >

            <Settings
              size={19}
              className="
                text-gray-400
                group-hover:text-gray-600
              "
            />

            <span>
              Settings
            </span>

          </button>

        </div>


        {/* ====================================================
            USER / LOGOUT
            ==================================================== */}

        <div
          className="
            border-t
            border-gray-100
            p-4
          "
        >

          <div
            className="
              mb-2
              flex
              items-center
              gap-3
              rounded-xl
              bg-gray-50
              p-3
            "
          >

            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-full
                bg-brand-100
                font-bold
                text-brand-700
              "
            >

              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || 'U'}

            </div>


            <div className="min-w-0">

              <p
                className="
                  truncate
                  text-sm
                  font-bold
                  text-gray-900
                "
              >
                {user?.name || 'User'}
              </p>


              <p
                className="
                  truncate
                  text-xs
                  text-gray-400
                "
              >
                {user?.email || ''}
              </p>

            </div>

          </div>


          <button
            onClick={handleLogout}
            className="
              flex
              w-full
              items-center
              gap-3
              rounded-xl
              px-3
              py-3
              text-sm
              font-medium
              text-gray-500
              transition
              hover:bg-red-50
              hover:text-red-600
            "
          >

            <LogOut size={18} />

            Log out

          </button>

        </div>

      </aside>


      {/* ======================================================
          MAIN AREA
          ====================================================== */}

      <div
        className="
          flex
          min-w-0
          flex-1
          flex-col
        "
      >


        {/* ====================================================
            DESKTOP HEADER
            ==================================================== */}

        <header
          className="
            hidden
            h-[76px]
            items-center
            justify-between
            border-b
            border-gray-100
            bg-white
            px-8
            md:flex
          "
        >

          {/* GREETING */}

          <div>

            <h2
              className="
                text-xl
                font-bold
                text-gray-900
              "
            >

              Hi, {user?.name || 'there'} 👋

            </h2>


            <p
              className="
                mt-1
                text-sm
                text-gray-500
              "
            >

              Welcome back to StageOne

            </p>

          </div>


          {/* USER PROFILE */}

          <button
            onClick={() =>
              navigate('/settings')
            }
            className="
              flex
              items-center
              gap-3
              rounded-xl
              px-2
              py-1.5
              transition
              hover:bg-gray-50
            "
          >

            <div
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                bg-brand-100
                font-bold
                text-brand-700
              "
            >

              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || 'U'}

            </div>


            <div className="text-left">

              <p
                className="
                  text-sm
                  font-bold
                  text-gray-900
                "
              >
                {user?.name}
              </p>


              <p
                className="
                  text-xs
                  text-gray-400
                "
              >
                {user?.email}
              </p>

            </div>

          </button>

        </header>


        {/* ====================================================
            MOBILE HEADER
            ==================================================== */}

        <header
          className="
            flex
            h-16
            items-center
            justify-between
            border-b
            border-gray-100
            bg-white
            px-4
            md:hidden
          "
        >

          <div
            className="
              flex
              items-center
              gap-2
            "
          >

            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-xl
                bg-brand-600
                text-white
              "
            >

              <Ticket size={19} />

            </div>


            <span
              className="
                font-bold
                text-gray-900
              "
            >
              StageOne
            </span>

          </div>


          <div className="flex items-center gap-3">

            <span
              className="
                hidden
                text-sm
                font-semibold
                text-gray-700
                sm:block
              "
            >

              Hi, {user?.name || 'there'} 👋

            </span>


            <button
              onClick={() =>
                navigate('/settings')
              }
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                bg-brand-100
                font-bold
                text-brand-700
              "
            >

              {user?.name
                ?.charAt(0)
                ?.toUpperCase() || 'U'}

            </button>

          </div>

        </header>


        {/* ====================================================
            PAGE CONTENT
            ==================================================== */}

        <main
          className="
            mx-auto
            w-full
            max-w-7xl
            flex-1
            px-4
            py-8
            md:px-8
          "
        >

          {children}

        </main>

      </div>

    </div>

  );

}