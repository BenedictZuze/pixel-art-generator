// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use image::{ DynamicImage, GenericImage, GenericImageView, Pixel };

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
fn greet(name: &str, output: &str) -> String {
    let img_path = format!(r#"{}"#, name);
    let img = image::open(img_path).expect("Failed to open image");
    let pixel_size = 15;
    let pixelated_img = pixelate_image(&img, pixel_size);
    let output_path = format!(r#"{}"#, output);
    pixelated_img.save(output_path).expect("Failed to save image");
    format!("Hello, {}! You've been greeted from Rust!", name)
}

fn main() {
    tauri::Builder
        ::default()
        .invoke_handler(tauri::generate_handler![greet])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn pixelate_image(img: &DynamicImage, pixel_size: u32) -> DynamicImage {
    let (width, height) = img.dimensions();
    let mut pixelated_img = DynamicImage::new_rgba8(width, height);

    for y in (0..height).step_by(pixel_size as usize) {
        for x in (0..width).step_by(pixel_size as usize) {
            let mut r_sum = 0;
            let mut g_sum = 0;
            let mut b_sum = 0;
            let mut a_sum = 0;
            let mut count = 0;

            for dy in 0..pixel_size {
                for dx in 0..pixel_size {
                    if x + dx < width && y + dy < height {
                        let pixel = img.get_pixel(x + dx, y + dy);
                        let channels = pixel.channels();
                        r_sum += channels[0] as u32;
                        g_sum += channels[1] as u32;
                        b_sum += channels[2] as u32;
                        a_sum += channels[3] as u32;
                        count += 1;
                    }
                }
            }

            let r_avg = (r_sum / count) as u8;
            let g_avg = (g_sum / count) as u8;
            let b_avg = (b_sum / count) as u8;
            let a_avg = (a_sum / count) as u8;
            let avg_pixel = image::Rgba([r_avg, g_avg, b_avg, a_avg]);

            for dy in 0..pixel_size {
                for dx in 0..pixel_size {
                    if x + dx < width && y + dy < height {
                        pixelated_img.put_pixel(x + dx, y + dy, avg_pixel);
                    }
                }
            }
        }
    }

    pixelated_img
}
