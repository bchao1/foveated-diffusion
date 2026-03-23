# download videos from server

# baseline videos (480p)
#baseline_dir="/home/brianchc/fov_video/results/baseline_comparison/stacked_videos"
#scp -r brianchc@apollo:${baseline_dir}/* ./static/videos/baselines/

# baseline videos (720p)
# baseline_dir="/home/brianchc/fov_video/results/baseline_comparison/stacked_videos_720p"
# scp -r brianchc@apollo:${baseline_dir}/* ./static/videos/baselines_720p/
# exit
# 
# # saliency videos 
# mode=("av" "games" "robotics")
# for m in "${mode[@]}"; do
#     mkdir -p ./static/videos/saliency/${m}_720p
#     saliency_dir="/home/brianchc/fov_video/results/saliency/${m}_fix_radius_720p/videos_with_circle"
#     scp -r brianchc@apollo:${saliency_dir}/*.mp4 ./static/videos/saliency/${m}_720p
# done

# fov trajectory videos
# fov_trajectory_dir="/home/brianchc/fov_video/results/fov_traj/stacked"
# scp -r brianchc@apollo:${fov_trajectory_dir}/*.mp4 ./static/videos/fov_traj/

# stacked saliency comparison videos
# dir=/home/brianchc/fov_video/results/saliency/stacked_videos
# scp -r brianchc@apollo:${dir}/* ./static/videos/saliency/random_mask_comparison/

### IMAGE DATA
