import VideoErrorDto from "./video-error-dto";

/**
 * Data Transfer Object for Video Job
 * https://platform.openai.com/docs/api-reference/videos/object
 */
export default class VideoJobDto {

    /**
     * Unix timestamp (seconds) for when the job completed, if finished.
     */
    completed_at?: number

    /**
     * Unix timestamp (seconds) for when the job was created.
     */
    created_at?: number

    /**
     * Error payload that explains why generation failed, if applicable.
     */
    error?: VideoErrorDto

    /**
     * Unix timestamp (seconds) for when the downloadable assets expire, if set.
     */
    expires_at?: number

    /**
     * Unique identifier for the video job.
     */
    id?: string

    /**
     * The video generation model that produced the job.
     */
    model?: string

    /**
     * Approximate completion percentage for the generation task.
     */
    progress?: number

    /**
     * Identifier of the source video if this video is a remix.
     */
    remixed_from_video_id?: string

    /**
     * Duration of the generated clip in seconds.
     */
    seconds?: string

    /**
     * The resolution of the generated video.
     */
    size?: string

    /**
     * Current lifecycle status of the video job.
     */
    status?: string
}
