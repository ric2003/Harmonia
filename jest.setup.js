import "@testing-library/jest-dom";

// Mock Next.js router
jest.mock("next/router", () => ({
  useRouter() {
    return {
      route: "/",
      pathname: "/",
      query: {},
      asPath: "/",
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock Next.js navigation
jest.mock("next/navigation", () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
    };
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return "/";
  },
}));

// Mock environment variables
process.env.NEXT_PUBLIC_CONVEX_URL = "https://test-convex-url.com";
process.env.IRRISTRAT_TOKEN = "test-token";

// Mock Leaflet
jest.mock("leaflet", () => ({
  map: jest.fn(() => ({
    setView: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn(),
  })),
  marker: jest.fn(() => ({
    addTo: jest.fn(),
    bindPopup: jest.fn(),
    on: jest.fn(),
  })),
  circleMarker: jest.fn(() => ({
    addTo: jest.fn(),
    bindPopup: jest.fn(),
    on: jest.fn(),
    setStyle: jest.fn(),
    setRadius: jest.fn(),
  })),
  icon: jest.fn(),
  divIcon: jest.fn(),
}));

// Mock react-leaflet
jest.mock("react-leaflet", () => ({
  MapContainer: ({ children, ...props }) => (
    <div data-testid="map-container" {...props}>
      {children}
    </div>
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  Marker: ({ children, ...props }) => (
    <div data-testid="marker" {...props}>
      {children}
    </div>
  ),
  Popup: ({ children, ...props }) => (
    <div data-testid="popup" {...props}>
      {children}
    </div>
  ),
  useMap: () => ({
    setView: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
  }),
}));

// Mock Clerk authentication
jest.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isSignedIn: false,
    user: null,
    isLoaded: true,
  }),
  useAuth: () => ({
    isSignedIn: false,
    userId: null,
  }),
  SignIn: () => <div data-testid="sign-in" />,
  SignUp: () => <div data-testid="sign-up" />,
}));

// Mock Convex
jest.mock("convex/react", () => ({
  useQuery: jest.fn(() => null),
  useMutation: jest.fn(() => jest.fn()),
}));

// Mock i18next
jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: "en",
    },
  }),
}));

// Global test utilities
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

global.matchMedia = jest.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));
