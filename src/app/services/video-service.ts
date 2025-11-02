import {Injectable} from "@angular/core";
import {VideoModelType} from "../enums/video-model-type";
import {VideoResolution} from "../enums/video-resolution";
import VideoJobDto from "../dtos/video-job-dto";
import {SortOrder} from "../enums/sort-order";
import AuthService from "./auth-service";
import {HttpClient, HttpParams} from "@angular/common/http";
import NotificationService from "./notification-service";

@Injectable({providedIn: 'root'})
export default class VideoService {

    private readonly localStorageVideosKey: string = 'generated_videos'

    private loadingVideosIds: string[]
    loadingVideos: VideoJobDto[] = []

    constructor(
        private readonly authService: AuthService,
        private readonly httpClient: HttpClient,
        private readonly notificationService: NotificationService
    ) {
        let localStorageVideos = localStorage.getItem(this.localStorageVideosKey)

        this.loadingVideosIds = localStorageVideos ? JSON.parse(localStorageVideos) : []

        setInterval(() => this.loadingVideosIds, 15000)
    }

    public estimateVideoCost(duration: number, size: VideoResolution, model: VideoModelType): number {
        if (model === VideoModelType.SORA_2) {
            return 0.1 * duration
        } else {
            if (size === VideoResolution.PORTAIT_720P || size === VideoResolution.LANDSCAPE_720P) {
                return 0.3 * duration
            } else {
                return 0.5 * duration
            }
        }
    }

    public generateVideo(
        prompt: string,
        model: VideoModelType = VideoModelType.SORA_2,
        imageRef?: Blob,
        duration: number = 4,
        size: VideoResolution = VideoResolution.PORTAIT_720P
    ) {
        this.httpClient.post<VideoJobDto>('https://api.openai.com/v1/videos', {
            prompt: prompt,
            model: model,
            input_reference: imageRef,
            seconds: duration,
            size: size
        }, {
            headers: {
                'Authorization': `Bearer ${this.authService.getBearerToken()}`,
                'Content-Type': 'application/json'
            }
        }).subscribe({
            next: (videoJob: VideoJobDto) => {
                if (videoJob.id) {
                    this.loadingVideosIds.push(videoJob.id)
                    this.loadingVideos.push(videoJob)
                    localStorage.setItem(this.localStorageVideosKey, JSON.stringify(this.loadingVideosIds))
                    this.notificationService.info("Video generation started. This may take a few minutes.")
                }
            },
            error: (error) => {
                this.notificationService.error('Failed to generate video. Please try again. Error details: ' + error.message)
                console.error('Error generating video:', error)
            }
        })
    }

    public remixVideo(videoId: string, prompt: string) {
        this.httpClient.post<VideoJobDto>(`https://api.openai.com/v1/videos/${videoId}/remix`, {
            prompt: prompt
        }, {
            headers: {
                'Authorization': `Bearer ${this.authService.getBearerToken()}`,
                'Content-Type': 'application/json'
            }
        }).subscribe({
            next: (videoJob: VideoJobDto) => {
                if (videoJob.id) {
                    this.loadingVideosIds.push(videoJob.id)
                    this.loadingVideos.push(videoJob)
                    this.notificationService.info("Video remix started. This may take a few minutes.")
                    localStorage.setItem(this.localStorageVideosKey, JSON.stringify(this.loadingVideosIds))
                }
            },
            error: (error) => {
                this.notificationService.error('Failed to remix video. Please try again. Error details: ' + error.message)
                console.error('Error remixing video:', error)
            }
        })
    }

    public listVideos(completion: (videoJobs: VideoJobDto[]) => void, after?: string, limit?: number, order?: SortOrder) {
        const params: HttpParams = new HttpParams()

        if (after) {
            params.set('after', after)
        }
        if (limit) {
            params.set('limit', limit.toString())
        }
        if (order) {
            params.set('order', order)
        }

        this.httpClient.get<{data: VideoJobDto[]}>('https://api.openai.com/v1/videos', {
            headers: {
                'Authorization': `Bearer ${this.authService.getBearerToken()}`,
                'Content-Type': 'application/json'
            },
            params: params
        }).subscribe({
            next: (response) => {
                completion(response.data)
            },
            error: (error) => {
                completion([])
                this.notificationService.error('Failed to list videos. Please try again. Error details: ' + error.message)
                console.error('Error listing videos:', error)
            }
        })
    }

    public deleteVideo(videoId: string) {
        this.httpClient.delete(`https://api.openai.com/v1/videos/${videoId}`, {
            headers: {
                'Authorization': `Bearer ${this.authService.getBearerToken()}`,
                'Content-Type': 'application/json'
            }
        }).subscribe({
            next: () => {
                this.notificationService.info('Video deleted successfully.')
            },
            error: (error) => {
                this.notificationService.error('Failed to delete video. Please try again. Error details: ' + error.message)
                console.error('Error deleting video:', error)
            }
        })
    }

    public getVideoData(videoId: string, completion: (blob: Blob | null) => void) {
        this.httpClient.get(`https://api.openai.com/v1/videos/${videoId}/content`, {
            headers: {
                'Authorization': `Bearer ${this.authService.getBearerToken()}`,
            },
            responseType: 'blob'
        }).subscribe({
            next: (data: Blob) => {
                completion(data)
            },
            error: (error) => {
                completion(null)
                this.notificationService.error('Failed to get video data. Please try again. Error details: ' + error.message)
                console.error('Error getting video data:', error)
            }
        })
    }

    private checkLoadingVideosStatus() {
        this.loadingVideosIds.forEach((videoId) => {
            this.fetchVideo(videoId, (videoJob) => {
                if (videoJob?.progress) {
                    const index = this.loadingVideos.findIndex(v => v.id === videoId)
                    if (index !== -1) {
                        this.loadingVideos[index] = videoJob
                    }

                    if (videoJob.progress >= 100 || videoJob.error || videoJob.status === 'failed' || videoJob.status === 'completed') {
                        this.loadingVideosIds = this.loadingVideosIds.filter(id => id !== videoId)
                        this.loadingVideos = this.loadingVideos.filter(v => v.id !== videoId)
                        localStorage.setItem(this.localStorageVideosKey, JSON.stringify(this.loadingVideosIds))
                    }
                }
            })
        })
    }

    private fetchVideo(videoId: string, completion: (videoJob: VideoJobDto | null) => void) {
        this.httpClient.get<VideoJobDto>(`https://api.openai.com/v1/videos/${videoId}`, {
            headers: {
                'Authorization': `Bearer ${this.authService.getBearerToken()}`,
                'Content-Type': 'application/json'
            }
        }).subscribe({
            next: (videoJob: VideoJobDto) => {
                completion(videoJob)
            },
            error: (error) => {
                completion(null)
                this.notificationService.error('Failed to fetch video. Please try again. Error details: ' + error.message)
                console.error('Error fetching video:', error)
            }
        })
    }

}
