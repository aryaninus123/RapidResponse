from apify_client import ApifyClient
from typing import Dict, List, Optional
import asyncio
import json
from redis import Redis
from datetime import datetime
import os

class ApifyDataCollector:
    def __init__(self, api_token: str):
        """
        Initialize the Apify data collector
        
        Args:
            api_token: Apify API token
        """
        self.client = ApifyClient(api_token)
        self.cache = Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
        
        # Cache TTLs in seconds
        self.cache_ttls = {
            "hospitals": 3600,  # 1 hour
            "traffic": 300,     # 5 minutes
            "weather": 600,     # 10 minutes
            "services": 1800    # 30 minutes
        }

    async def get_emergency_context(
        self,
        location: Dict[str, float],
        emergency_type: str
    ) -> Dict:
        """
        Get contextual data for an emergency
        
        Args:
            location: Dictionary with lat and lon
            emergency_type: Type of emergency
            
        Returns:
            Dictionary containing contextual data
        """
        try:
            # Run tasks in parallel
            tasks = [
                self._get_weather_data(location),
                self._get_traffic_data(location),
                self._get_facilities_data(location, emergency_type)
            ]
            
            results = await asyncio.gather(*tasks)
            weather, traffic, facilities = results
            
            return {
                "weather": weather,
                "traffic": traffic,
                **facilities
            }
            
        except Exception as e:
            raise Exception(f"Failed to get emergency context: {str(e)}")

    async def _get_weather_data(self, location: Dict[str, float]) -> Dict:
        """Get weather data for location"""
        try:
            # Use Apify weather actor
            run = self.client.actor("apify/weather").call(
                run_input={
                    "lat": location["lat"],
                    "lon": location["lon"]
                }
            )
            
            # Get the results
            data = run["data"]
            
            return {
                "temperature": data["temperature"],
                "conditions": data["conditions"],
                "wind_speed": data["windSpeed"],
                "visibility": data["visibility"]
            }
            
        except Exception:
            # Return minimal data if weather fetch fails
            return {
                "temperature": None,
                "conditions": "unknown",
                "wind_speed": None,
                "visibility": None
            }

    async def _get_traffic_data(self, location: Dict[str, float]) -> Dict:
        """Get traffic data for location"""
        try:
            # Use Apify traffic actor
            run = self.client.actor("apify/traffic").call(
                run_input={
                    "lat": location["lat"],
                    "lon": location["lon"],
                    "radius": 2000  # 2km radius
                }
            )
            
            # Get the results
            data = run["data"]
            
            return {
                "congestion_level": data["congestionLevel"],
                "average_speed": data["averageSpeed"],
                "incidents": data["incidents"]
            }
            
        except Exception:
            # Return minimal data if traffic fetch fails
            return {
                "congestion_level": "unknown",
                "average_speed": None,
                "incidents": []
            }

    async def _get_facilities_data(
        self,
        location: Dict[str, float],
        emergency_type: str
    ) -> Dict:
        """Get nearby facilities based on emergency type"""
        try:
            facilities = {}
            
            # Get relevant facilities based on emergency type
            if emergency_type == "MEDICAL":
                hospitals = await self._get_hospitals(location)
                facilities["hospitals"] = hospitals
                
            elif emergency_type == "FIRE":
                fire_stations = await self._get_fire_stations(location)
                facilities["fire_stations"] = fire_stations
                
            elif emergency_type == "POLICE":
                police_stations = await self._get_police_stations(location)
                facilities["police_stations"] = police_stations
                
            return facilities
            
        except Exception:
            return {}

    async def _get_hospitals(self, location: Dict[str, float]) -> list:
        """Get nearby hospitals"""
        try:
            run = self.client.actor("apify/hospitals").call(
                run_input={
                    "lat": location["lat"],
                    "lon": location["lon"],
                    "radius": 5000  # 5km radius
                }
            )
            
            return run["data"]
            
        except Exception:
            return []

    async def _get_fire_stations(self, location: Dict[str, float]) -> list:
        """Get nearby fire stations"""
        try:
            run = self.client.actor("apify/fire-stations").call(
                run_input={
                    "lat": location["lat"],
                    "lon": location["lon"],
                    "radius": 5000  # 5km radius
                }
            )
            
            return run["data"]
            
        except Exception:
            return []

    async def _get_police_stations(self, location: Dict[str, float]) -> list:
        """Get nearby police stations"""
        try:
            run = self.client.actor("apify/police-stations").call(
                run_input={
                    "lat": location["lat"],
                    "lon": location["lon"],
                    "radius": 5000  # 5km radius
                }
            )
            
            return run["data"]
            
        except Exception:
            return []

    async def get_nearby_hospitals(self, location: Dict[str, float]) -> Dict:
        """Get nearby hospitals using Apify actor"""
        cache_key = f"hospitals:{location['lat']}:{location['lon']}"
        
        # Check cache
        if cached := await self._get_from_cache(cache_key):
            return {"hospitals": cached}
        
        try:
            run_input = {
                "startUrls": [{
                    "url": f"https://maps.google.com/search/hospitals/@{location['lat']},{location['lon']}"
                }],
                "radius": "10km"
            }
            
            # Run Apify actor
            run = await self.client.actor("apify/google-places-scraper").call(
                run_input=run_input
            )
            
            # Get results
            items = await self.client.dataset(run["defaultDatasetId"]).list_items().items()
            
            # Process and cache results
            hospitals = self._process_hospital_data(items)
            await self._set_in_cache(cache_key, hospitals, "hospitals")
            
            return {"hospitals": hospitals}
            
        except Exception as e:
            print(f"Error fetching hospital data: {str(e)}")
            return {"hospitals": []}

    async def get_traffic_conditions(self, location: Dict[str, float]) -> Dict:
        """Get traffic conditions using Apify actor"""
        cache_key = f"traffic:{location['lat']}:{location['lon']}"
        
        if cached := await self._get_from_cache(cache_key):
            return {"traffic": cached}
            
        try:
            run_input = {
                "location": f"{location['lat']},{location['lon']}",
                "radius": 5000  # 5km radius
            }
            
            run = await self.client.actor("apify/google-maps-traffic").call(
                run_input=run_input
            )
            
            items = await self.client.dataset(run["defaultDatasetId"]).list_items().items()
            
            traffic_data = self._process_traffic_data(items)
            await self._set_in_cache(cache_key, traffic_data, "traffic")
            
            return {"traffic": traffic_data}
            
        except Exception as e:
            print(f"Error fetching traffic data: {str(e)}")
            return {"traffic": {"status": "unknown"}}

    async def get_weather_data(self, location: Dict[str, float]) -> Dict:
        """Get weather data using Apify actor"""
        cache_key = f"weather:{location['lat']}:{location['lon']}"
        
        if cached := await self._get_from_cache(cache_key):
            return {"weather": cached}
            
        try:
            run = await self.client.actor("apify/weather-checker").call(
                run_input={"locations": [f"{location['lat']},{location['lon']}"]}
            )
            
            items = await self.client.dataset(run["defaultDatasetId"]).list_items().items()
            
            weather_data = self._process_weather_data(items)
            await self._set_in_cache(cache_key, weather_data, "weather")
            
            return {"weather": weather_data}
            
        except Exception as e:
            print(f"Error fetching weather data: {str(e)}")
            return {"weather": {"status": "unknown"}}

    def _process_hospital_data(self, items: List[Dict]) -> List[Dict]:
        """Process and format hospital data"""
        return [{
            "name": item.get("name"),
            "address": item.get("address"),
            "phone": item.get("phone"),
            "rating": item.get("rating"),
            "distance": item.get("distance"),
            "emergency": item.get("emergency", False)
        } for item in items]

    def _process_traffic_data(self, items: List[Dict]) -> Dict:
        """Process and format traffic data"""
        return {
            "congestion_level": items[0].get("congestionLevel", "unknown"),
            "incidents": items[0].get("incidents", []),
            "average_speed": items[0].get("averageSpeed"),
            "timestamp": datetime.now().isoformat()
        }

    def _process_weather_data(self, items: List[Dict]) -> Dict:
        """Process and format weather data"""
        if not items:
            return {"status": "unknown"}
            
        weather = items[0]
        return {
            "temperature": weather.get("temperature"),
            "conditions": weather.get("conditions"),
            "visibility": weather.get("visibility"),
            "wind_speed": weather.get("windSpeed"),
            "precipitation": weather.get("precipitation"),
            "timestamp": datetime.now().isoformat()
        }

    async def _get_from_cache(self, key: str) -> Optional[Dict]:
        """Get data from Redis cache"""
        try:
            data = await self.cache.get(key)
            return json.loads(data) if data else None
        except Exception:
            return None

    async def _set_in_cache(self, key: str, data: Dict, data_type: str):
        """Set data in Redis cache with appropriate TTL"""
        try:
            await self.cache.set(
                key,
                json.dumps(data),
                ex=self.cache_ttls.get(data_type, 3600)
            )
        except Exception as e:
            print(f"Cache error: {str(e)}") 