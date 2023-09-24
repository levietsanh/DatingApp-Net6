using AutoMapper;
using DatingApp.Data;
using DatingApp.Helpers;
using DatingApp.Interfaces;
using DatingApp.Services;
using Microsoft.EntityFrameworkCore;

namespace DatingApp.Extensions
{
    public static class ApplicationServiceExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services, IConfiguration config)
        {
            //add Cloudinary
            services.Configure<CloudinarySettings>(config.GetSection("CloudinarySettings"));
            //add Token
            services.AddScoped<ITokenService, TokenService>();

            //add service Photo
            services.AddScoped<IPhotoService, PhotoService>();

            // add service Like
            services.AddScoped<ILikesRepository, LikesRepository>();

            //add service LogUserAcitvity
            services.AddScoped<LogUserActivity>();
            services.AddScoped<IUserRepository, UserRepository>();

            services.AddScoped<IMessageRepository, MessageRepository>();
            services.AddAutoMapper(typeof(AutoMapperProfiles).Assembly);
            //connection database
            services.AddDbContext<DataContext>(options =>
            {
                options.UseSqlite(config.GetConnectionString("DefaultConnection"));
            });
            return services;
        }
    }
}
