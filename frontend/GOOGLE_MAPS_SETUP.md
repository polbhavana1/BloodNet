# Google Maps API Setup Guide

To enable real Google Maps in the BloodNet+ donor dashboard, follow these steps:

## 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API**
   - **Geocoding API**
   - **Places API** (optional, for enhanced features)

4. Create credentials:
   - Go to "Credentials" → "Create Credentials" → "API Key"
   - Copy the generated API key

## 2. Configure the API Key

1. Open the `.env` file in the `frontend` directory
2. Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual API key:

```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

## 3. Restart the Frontend

After updating the `.env` file, restart the frontend server:

```bash
cd frontend
npm start
```

## 4. Security Recommendations

1. **Restrict your API key** in the Google Cloud Console:
   - Go to "Credentials" → Click on your API key
   - Under "Application restrictions", select "HTTP referrers"
   - Add: `http://localhost:3000/*` and `http://127.0.0.1:3000/*`

2. **Enable API restrictions**:
   - Under "API restrictions", select "Restrict key"
   - Select only the APIs you enabled in step 1

## 5. Features Enabled

With Google Maps integration, you'll get:

- ✅ **Real map tiles** and satellite imagery
- ✅ **Interactive zoom and pan** controls
- ✅ **Custom colored markers** for blood requests
- ✅ **Info windows** with request details
- ✅ **Street view** integration
- ✅ **Address geocoding**
- ✅ **Professional map styling**

## 6. Troubleshooting

### "Loading Google Maps..." persists
- Check if your API key is valid
- Ensure all required APIs are enabled
- Verify your API key restrictions

### "This page can't load Google Maps correctly"
- Check browser console for error messages
- Verify API key is set correctly in `.env`
- Ensure you've restarted the frontend after changes

### Map appears but no markers
- Check if requests have location data
- Verify latitude/longitude coordinates are valid
- Check browser console for JavaScript errors

## 7. Usage

Once set up:

1. Navigate to the donor dashboard
2. Click the "📍 Map View" tab
3. Interact with the real Google Maps:
   - Zoom in/out with controls or mouse wheel
   - Pan by dragging
   - Click markers to see request details
   - Use street view for location exploration

## 8. Costs

Google Maps API has a generous free tier:
- **Maps JavaScript API**: 28,000 map loads per month
- **Geocoding API**: 40,000 requests per month
- **Places API**: 100,000 requests per month

For typical BloodNet+ usage, the free tier should be sufficient. Monitor your usage in the Google Cloud Console.

---

**Note**: If you don't set up a Google Maps API key, the system will fall back to a simple interactive map with basic functionality.
