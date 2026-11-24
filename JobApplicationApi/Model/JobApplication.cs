namespace JobApplicationApi.Model
{
    public class JobApplication
    {
        public int Id { get; set; }
        public string Company { get; set; } = "";
        public string Role { get; set; } = "";
        public string Source { get; set; } = "";
        public string Status { get; set; } = "Applied";
        public DateTime AppliedOn { get; set; }
        public decimal? OfferedCtc { get; set; }
        public string? Notes { get; set; }
        public int UserId { get; set; }
    }
}
