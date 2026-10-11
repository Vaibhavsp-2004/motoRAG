from youtube_transcript_api import YouTubeTranscriptApi

video_id = "6IbrAP24UbM"

api = YouTubeTranscriptApi()

transcript = api.fetch(video_id)

print("Number of transcript entries:", len(transcript))

# Calculate total duration
last_entry = transcript[-1]

video_duration = (
    last_entry.start +
    last_entry.duration
)

print(
    f"Approximate transcript duration: "
    f"{video_duration:.2f} seconds"
)

print(
    f"Approximate duration: "
    f"{video_duration / 60:.2f} minutes"
)

print("\nFirst 10 entries:\n")

for entry in transcript[:10]:

    print(
        f"[{entry.start:.2f}s - "
        f"{entry.start + entry.duration:.2f}s] "
        f"{entry.text}"
    )