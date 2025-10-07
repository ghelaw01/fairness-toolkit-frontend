# AI Fairness Toolkit - Frontend

A modern, responsive web interface for analyzing machine learning model fairness and detecting bias in datasets.

## Features

- **Intuitive Dashboard**: Clean, user-friendly interface for fairness analysis
- **File Upload**: Drag-and-drop CSV file upload
- **Demo Mode**: Quick testing with pre-loaded COMPAS dataset
- **Interactive Visualizations**: Charts and graphs for fairness metrics
- **Bias Analysis**: Visual representation of bias across protected attributes
- **Explainability**: SHAP and LIME visualizations for model interpretability
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Quick Start

### Prerequisites

- Node.js 16 or higher
- npm or pnpm package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ghelaw01/fairness-toolkit-frontend.git
cd fairness-toolkit-frontend
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Configure backend API URL:

Create a `.env` file in the root directory:
```env
VITE_API_URL=http://localhost:5000
```

4. Run the development server:
```bash
npm run dev
# or
pnpm dev
```

The application will be available at `http://localhost:5173`

## Build for Production

```bash
npm run build
# or
pnpm build
```

The production-ready files will be in the `dist/` directory.

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx              # Main application component
│   ├── App.css              # Application styles
│   ├── main.jsx             # Application entry point
│   ├── components/
│   │   └── ui/              # Reusable UI components
│   ├── hooks/               # Custom React hooks
│   └── lib/
│       └── utils.js         # Utility functions
├── public/
│   └── favicon.ico          # Application icon
├── index.html               # HTML template
├── vite.config.js           # Vite configuration
└── package.json             # Dependencies and scripts
```

## Technology Stack

- **React 18**: UI framework
- **Vite**: Build tool and dev server
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: Component library
- **Recharts**: Charting library for visualizations
- **Lucide React**: Icon library

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
VITE_API_URL=http://localhost:5000
```

For production deployment:
```env
VITE_API_URL=https://your-backend-api.onrender.com
```

## Deployment

### Deploy to Render

1. Push code to GitHub
2. Create a new Static Site on Render
3. Connect your GitHub repository
4. Set build command: `npm install && npm run build`
5. Set publish directory: `dist`
6. Add environment variable: `VITE_API_URL` with your backend URL
7. Deploy!

### Deploy to Vercel

```bash
npm install -g vercel
vercel
```

### Deploy to Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

## Usage Guide

### 1. Upload Dataset

- Click "Upload CSV" button
- Select a CSV file with your dataset
- The file should include:
  - Target column (prediction/outcome)
  - Protected attributes (race, gender, age, etc.)
  - Feature columns

### 2. Use Demo Data

- Click "Load Demo" to use the COMPAS recidivism dataset
- Pre-configured with target and protected attributes

### 3. Analyze Fairness

- Select target column from dropdown
- Select protected attribute (e.g., race, gender)
- Click "Analyze" to see fairness metrics
- View demographic parity, equal opportunity, and disparate impact

### 4. Detect Bias

- Navigate to "Bias" tab
- Select multiple protected attributes
- View bias detection results with visualizations

### 5. Explain Predictions

- Navigate to "Explain" tab
- Select a sample from the dataset
- View SHAP and LIME explanations
- Understand feature importance

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### API Connection Issues

If you see "Failed to fetch" errors:
1. Check that backend server is running
2. Verify `VITE_API_URL` in `.env` file
3. Check browser console for CORS errors
4. Ensure backend has CORS enabled

### Build Errors

If build fails:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Clear cache: `npm cache clean --force`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License

## Support

For issues and questions, please open an issue on GitHub.

## Related

- Backend Repository: https://github.com/ghelaw01/fairness-toolkit-backend
- Live Demo: [Coming soon]
