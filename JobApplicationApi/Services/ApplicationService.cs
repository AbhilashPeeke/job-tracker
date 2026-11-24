using JobApplicationApi.Data;
using JobApplicationApi.Dtos;
using JobApplicationApi.Model;
using JobApplicationApi.Models;
using Microsoft.EntityFrameworkCore;

namespace JobApplicationApi.Services;

public class ApplicationService : IApplicationService
{
    private readonly AppDbContext _db;
    public ApplicationService(AppDbContext db) => _db = db;

    // One place decides what the caller may see: admins see all, others only their own
    private IQueryable<JobApplication> Scope(int userId, bool isAdmin) =>
        isAdmin ? _db.JobApplications : _db.JobApplications.Where(a => a.UserId == userId);

    public async Task<List<ApplicationResponse>> GetAllAsync(int userId, bool isAdmin, CancellationToken ct)
    {
        var items = await Scope(userId, isAdmin).AsNoTracking()
            .OrderByDescending(a => a.AppliedOn).ToListAsync(ct);
        return items.Select(ToResponse).ToList();
    }

    public async Task<ApplicationResponse?> GetAsync(int id, int userId, bool isAdmin, CancellationToken ct)
    {
        var item = await Scope(userId, isAdmin).AsNoTracking().FirstOrDefaultAsync(a => a.Id == id, ct);
        return item is null ? null : ToResponse(item);
    }

    public async Task<ApplicationResponse> CreateAsync(ApplicationRequest request, int userId, CancellationToken ct)
    {
        var entity = new JobApplication { UserId = userId };   // owner comes from the token, never from the request
        Apply(entity, request);
        _db.JobApplications.Add(entity);
        await _db.SaveChangesAsync(ct);
        return ToResponse(entity);
    }

    public async Task<bool> UpdateAsync(int id, ApplicationRequest request, int userId, bool isAdmin, CancellationToken ct)
    {
        var entity = await Scope(userId, isAdmin).FirstOrDefaultAsync(a => a.Id == id, ct);
        if (entity is null) return false;
        Apply(entity, request);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> DeleteAsync(int id, int userId, bool isAdmin, CancellationToken ct)
    {
        var entity = await Scope(userId, isAdmin).FirstOrDefaultAsync(a => a.Id == id, ct);
        if (entity is null) return false;
        _db.JobApplications.Remove(entity);
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static void Apply(JobApplication e, ApplicationRequest r)
    {
        e.Company = r.Company.Trim();
        e.Role = r.Role.Trim();
        e.Source = r.Source.Trim();
        e.Status = r.Status;
        e.AppliedOn = r.AppliedOn;
        e.OfferedCtc = r.OfferedCtc;
        e.Notes = r.Notes?.Trim();
    }

    private static ApplicationResponse ToResponse(JobApplication a) =>
        new(a.Id, a.Company, a.Role, a.Source, a.Status, a.AppliedOn, a.OfferedCtc, a.Notes);
}