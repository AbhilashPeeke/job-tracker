using JobApplicationApi.Data;
using JobApplicationApi.Dtos;
using JobApplicationApi.Services;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace JobApplicationApi.Tests;

public class ApplicationServiceTests : IDisposable
{
    private const int UserA = 1;
    private const int UserB = 2;
    private const int AdminId = 99;

    private readonly SqliteConnection _connection;
    private readonly AppDbContext _db;
    private readonly ApplicationService _service;

    public ApplicationServiceTests()
    {
        // an in-memory SQLite database lives as long as this connection stays open
        _connection = new SqliteConnection("DataSource=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseSqlite(_connection)
            .Options;

        _db = new AppDbContext(options);
        _db.Database.EnsureCreated();
        _service = new ApplicationService(_db);
    }

    public void Dispose()
    {
        _db.Dispose();
        _connection.Dispose();
    }

    private static ApplicationRequest Request(string company = "Capco", string role = ".NET Developer",
        DateTime? appliedOn = null) => new()
    {
        Company = company,
        Role = role,
        Source = "Naukri",
        Status = "Applied",
        AppliedOn = appliedOn ?? new DateTime(2026, 11, 24),
        OfferedCtc = 15,
        Notes = "note"
    };

    [Fact]
    public async Task Create_SetsOwnerFromTheCaller()
    {
        var created = await _service.CreateAsync(Request(), UserA, CancellationToken.None);

        var saved = await _db.JobApplications.SingleAsync(a => a.Id == created.Id);
        Assert.Equal(UserA, saved.UserId);
    }

    [Fact]
    public async Task GetAll_NormalUser_SeesOnlyOwnRecords()
    {
        await _service.CreateAsync(Request("A-One"), UserA, CancellationToken.None);
        await _service.CreateAsync(Request("A-Two"), UserA, CancellationToken.None);
        await _service.CreateAsync(Request("B-One"), UserB, CancellationToken.None);

        var result = await _service.GetAllAsync(UserA, isAdmin: false, CancellationToken.None);

        Assert.Equal(2, result.Count);
        Assert.All(result, r => Assert.StartsWith("A-", r.Company));
    }

    [Fact]
    public async Task GetAll_Admin_SeesEveryonesRecords()
    {
        await _service.CreateAsync(Request("A-One"), UserA, CancellationToken.None);
        await _service.CreateAsync(Request("B-One"), UserB, CancellationToken.None);

        var result = await _service.GetAllAsync(AdminId, isAdmin: true, CancellationToken.None);

        Assert.Equal(2, result.Count);
    }

    [Fact]
    public async Task GetAll_ReturnsNewestFirst()
    {
        await _service.CreateAsync(Request("Old", appliedOn: new DateTime(2026, 1, 1)), UserA, CancellationToken.None);
        await _service.CreateAsync(Request("New", appliedOn: new DateTime(2026, 11, 1)), UserA, CancellationToken.None);

        var result = await _service.GetAllAsync(UserA, false, CancellationToken.None);

        Assert.Equal("New", result[0].Company);
        Assert.Equal("Old", result[1].Company);
    }

    [Fact]
    public async Task Get_AnotherUsersRecord_ReturnsNull()
    {
        var created = await _service.CreateAsync(Request(), UserA, CancellationToken.None);

        var result = await _service.GetAsync(created.Id, UserB, isAdmin: false, CancellationToken.None);

        Assert.Null(result);
    }

    [Fact]
    public async Task Get_Admin_CanReadAnyRecord()
    {
        var created = await _service.CreateAsync(Request(), UserA, CancellationToken.None);

        var result = await _service.GetAsync(created.Id, AdminId, isAdmin: true, CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("Capco", result!.Company);
    }

    [Fact]
    public async Task Update_AnotherUsersRecord_ReturnsFalseAndLeavesDataUnchanged()
    {
        var created = await _service.CreateAsync(Request("Original"), UserA, CancellationToken.None);

        var ok = await _service.UpdateAsync(created.Id, Request("Hacked"), UserB, false, CancellationToken.None);

        Assert.False(ok);
        var saved = await _db.JobApplications.AsNoTracking().SingleAsync(a => a.Id == created.Id);
        Assert.Equal("Original", saved.Company);
    }

    [Fact]
    public async Task Update_OwnRecord_ChangesFieldsAndTrimsText()
    {
        var created = await _service.CreateAsync(Request("Before"), UserA, CancellationToken.None);

        var ok = await _service.UpdateAsync(created.Id, Request("  After  "), UserA, false, CancellationToken.None);

        Assert.True(ok);
        var saved = await _db.JobApplications.AsNoTracking().SingleAsync(a => a.Id == created.Id);
        Assert.Equal("After", saved.Company);
    }

    [Fact]
    public async Task Update_Admin_CannotChangeTheOwner()
    {
        var created = await _service.CreateAsync(Request(), UserA, CancellationToken.None);

        await _service.UpdateAsync(created.Id, Request("Edited"), AdminId, true, CancellationToken.None);

        var saved = await _db.JobApplications.AsNoTracking().SingleAsync(a => a.Id == created.Id);
        Assert.Equal(UserA, saved.UserId);
    }

    [Fact]
    public async Task Delete_AnotherUsersRecord_ReturnsFalseAndRecordRemains()
    {
        var created = await _service.CreateAsync(Request(), UserA, CancellationToken.None);

        var ok = await _service.DeleteAsync(created.Id, UserB, false, CancellationToken.None);

        Assert.False(ok);
        Assert.Equal(1, await _db.JobApplications.CountAsync());
    }

    [Fact]
    public async Task Delete_OwnRecord_RemovesIt()
    {
        var created = await _service.CreateAsync(Request(), UserA, CancellationToken.None);

        var ok = await _service.DeleteAsync(created.Id, UserA, false, CancellationToken.None);

        Assert.True(ok);
        Assert.Equal(0, await _db.JobApplications.CountAsync());
    }

    [Fact]
    public async Task Delete_MissingId_ReturnsFalse()
    {
        var ok = await _service.DeleteAsync(12345, UserA, false, CancellationToken.None);

        Assert.False(ok);
    }
}