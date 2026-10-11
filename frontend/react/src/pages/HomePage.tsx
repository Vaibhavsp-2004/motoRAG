import { Link } from 'react-router-dom';
import { NavBar } from '../components/NavBar';

export const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-primaryBg text-textPrimary">
      <NavBar />

      <section className="flex-1 flex flex-col items-center justify-center p-8">
        <h1 className="text-4xl font-bold mb-4 text-accent">
          Find the Ride That Fits You
        </h1>

        <p className="text-lg mb-6 max-w-2xl text-center">
          Our AI-powered assistant recommends motorcycles based on your
          preferences, budget, and riding style.
        </p>

        <Link
          to="/finder"
          className="px-6 py-3 bg-accent text-white rounded-md hover:bg-orange-600 transition-colors"
        >
          Find My Motorcycle
        </Link>
      </section>
    </div>
  );
};

export default HomePage;