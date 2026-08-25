import React from 'react';

interface ErrorPageProps {
  statusCode: number;
  requestedResource?: string;
  onGoHome: () => void;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ statusCode, requestedResource, onGoHome }) => {
  const is404 = statusCode === 404;

  return (
    <section className="max-w-4xl mx-auto px-6 py-24 md:py-36 space-y-10 animate-fade-in text-echo-text">
      <p className="text-xs uppercase tracking-[0.4em] opacity-40">Error {statusCode}</p>
      <h1 className="instrument-serif italic text-5xl md:text-8xl leading-tight">
        {is404 ? 'This page is missing from the notebook.' : 'The author has his heart empty and not willing to share any feelings.'}
      </h1>

      {is404 ? (
        <div className="space-y-6 serif-font text-lg md:text-xl leading-relaxed opacity-85">
          <p>
            The route <span className="font-bold opacity-100">{requestedResource || window.location.hash || window.location.pathname}</span> could not be found.
          </p>
          <div className="border border-echo-border/60 p-6 bg-black/20 space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] opacity-60">How to resolve</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Check the link for typing mistakes.</li>
              <li>Return to the home page and continue from the main sections.</li>
              <li>If the page was removed, search the Feed or Echoes for related work.</li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-6 serif-font text-lg md:text-xl leading-relaxed opacity-85">
          <p>
            Something broke backstage. Try a quiet refresh in a moment, or step back to safer ground.
          </p>
          <p className="text-sm uppercase tracking-[0.25em] opacity-50">Error details: unexpected status {statusCode}</p>
        </div>
      )}

      <button
        onClick={onGoHome}
        className="px-8 py-3 border-2 border-echo-text bg-transparent text-echo-text hover:bg-echo-text hover:text-echo-bg transition-all duration-300 text-xs tracking-[0.25em] uppercase font-semibold"
      >
        Back to Home
      </button>
    </section>
  );
};

export default ErrorPage;
