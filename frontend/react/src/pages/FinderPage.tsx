import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearch } from '../context/SearchContext';
import { askQuestion } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { NavBar } from '../components/NavBar';

const schema = z.object({
  question: z.string().min(5, 'Please describe what you are looking for.'),
  brand: z.string().optional(),
  budgetMin: z.coerce.number().min(0).optional(),
  budgetMax: z.coerce.number().min(0).optional(),
});

type FormData = z.infer<typeof schema>;

export const FinderPage = () => {
  const { setRequest, setResponse, setLoading, loading } = useSearch();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });
  const [formError, setFormError] = useState<string>('');
  // Display any form submission error
  const formErrorMessage = formError && (
    <p className="text-sm text-red-400 mt-2">{formError}</p>
  );


  const onSubmit = async (data: FormData) => {
    const payload = {
      question: data.question,
      brand: data.brand || undefined,
      top_k: 5,
    } as any;
    setLoading(true);
    setFormError('');
    try {
      const resp = await askQuestion(payload);
      setRequest(payload);
      setResponse(resp);
      navigate('/results');
    } catch (e) {
      console.error(e);
      setFormError('Failed to fetch recommendations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primaryBg text-textPrimary">
      <NavBar />
      <section className="max-w-2xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-4 text-accent">AI Motorcycle Finder</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1" htmlFor="question">
              What are you looking for?
            </label>
            <textarea
              id="question"
              {...register('question')}
              className="w-full rounded-md p-2 bg-cardBg text-textPrimary focus:outline-none"
              rows={3}
            />
            {errors.question && (
              <p className="text-sm text-red-400 mt-1">{errors.question.message}</p>
            )}
          </div>
          <div>
            <label className="block mb-1" htmlFor="brand">
              Preferred Brand (optional)
            </label>
            <input
              id="brand"
              type="text"
              {...register('brand')}
              className="w-full rounded-md p-2 bg-cardBg text-textPrimary focus:outline-none"
            />
          </div>
          {/* Budget fields could be added here */}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-accent text-white rounded-md hover:bg-orange-600 transition disabled:opacity-50"
          >
            Find My Bike
          </button>
          {formErrorMessage}
        </form>
      </section>
    </div>
  );
};
export default FinderPage;
