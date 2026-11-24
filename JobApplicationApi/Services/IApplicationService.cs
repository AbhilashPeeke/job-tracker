using JobApplicationApi.Dtos;

namespace JobApplicationApi.Services;

public interface IApplicationService
{
    Task<List<ApplicationResponse>> GetAllAsync(int userId, bool isAdmin, CancellationToken ct);
    Task<ApplicationResponse?> GetAsync(int id, int userId, bool isAdmin, CancellationToken ct);
    Task<ApplicationResponse> CreateAsync(ApplicationRequest request, int userId, CancellationToken ct);
    Task<bool> UpdateAsync(int id, ApplicationRequest request, int userId, bool isAdmin, CancellationToken ct);
    Task<bool> DeleteAsync(int id, int userId, bool isAdmin, CancellationToken ct);
}