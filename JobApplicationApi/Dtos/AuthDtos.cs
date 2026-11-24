using System.ComponentModel.DataAnnotations;

namespace JobApplicationApi.Dtos;

public class RegisterRequest
{
    [Required, EmailAddress, StringLength(200)]
    public string Email { get; set; } = "";

    [Required, MinLength(8), StringLength(100)]
    public string Password { get; set; } = "";
}

public class LoginRequest
{
    [Required] public string Email { get; set; } = "";
    [Required] public string Password { get; set; } = "";
}

public record AuthResponse(string Token, string Email, string Role);