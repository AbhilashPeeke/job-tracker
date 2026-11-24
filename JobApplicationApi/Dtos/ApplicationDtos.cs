using System.ComponentModel.DataAnnotations;

namespace JobApplicationApi.Dtos;

public class ApplicationRequest
{
    [Required, StringLength(100)]
    public string Company { get; set; } = "";

    [Required, StringLength(100)]
    public string Role { get; set; } = "";

    [Required, StringLength(50)]
    public string Source { get; set; } = "";

    [AllowedValues("Applied", "Interview", "Rejected", "Offer")]
    public string Status { get; set; } = "Applied";

    public DateTime AppliedOn { get; set; }

    [Range(0, 1000)]                       // CTC in LPA
    public decimal? OfferedCtc { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}

public record ApplicationResponse(
    int Id, string Company, string Role, string Source, string Status,
    DateTime AppliedOn, decimal? OfferedCtc, string? Notes);