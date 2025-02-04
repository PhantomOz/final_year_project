import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import PropTypes from "prop-types";

const MarkdownRenderer = ({ content }) => {
  const components = {
    // Custom styling for different markdown elements
    h1: ({ node, ...props }) => (
      <h1 className="text-2xl font-bold mb-4" {...props} />
    ),
    h2: ({ node, ...props }) => (
      <h2 className="text-xl font-bold mb-3" {...props} />
    ),
    h3: ({ node, ...props }) => (
      <h3 className="text-lg font-bold mb-2" {...props} />
    ),
    p: ({ node, ...props }) => <p className="mb-4 text-gray-700" {...props} />,
    ul: ({ node, ...props }) => (
      <ul className="list-disc ml-6 mb-4" {...props} />
    ),
    ol: ({ node, ...props }) => (
      <ol className="list-decimal ml-6 mb-4" {...props} />
    ),
    li: ({ node, ...props }) => <li className="mb-1" {...props} />,
    strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
    em: ({ node, ...props }) => <em className="italic" {...props} />,
    blockquote: ({ node, ...props }) => (
      <blockquote
        className="border-l-4 border-gray-300 pl-4 italic my-4"
        {...props}
      />
    ),
    code: ({ node, inline, ...props }) =>
      inline ? (
        <code className="bg-gray-100 rounded px-1 py-0.5" {...props} />
      ) : (
        <code
          className="block bg-gray-100 rounded p-4 my-4 overflow-x-auto"
          {...props}
        />
      ),
    table: ({ node, ...props }) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full divide-y divide-gray-200" {...props} />
      </div>
    ),
    th: ({ node, ...props }) => (
      <th
        className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
        {...props}
      />
    ),
    td: ({ node, ...props }) => (
      <td
        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
        {...props}
      />
    ),
    tr: ({ node, ...props }) => (
      <tr className="bg-white even:bg-gray-50" {...props} />
    ),
    a: ({ node, ...props }) => (
      <a
        className="text-blue-600 hover:text-blue-800 hover:underline"
        {...props}
      />
    ),
    hr: ({ node, ...props }) => (
      <hr className="my-6 border-t border-gray-200" {...props} />
    ),
  };

  return (
    <div className="prose max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

MarkdownRenderer.propTypes = {
  content: PropTypes.string.isRequired,
};

export default MarkdownRenderer;
